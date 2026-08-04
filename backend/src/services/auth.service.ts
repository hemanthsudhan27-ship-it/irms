import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserRepository } from '../repositories/user.repository.js';
import { RoleRepository } from '../repositories/role.repository.js';
import { config } from '../config/index.js';
import { ILoginResponse, IJwtPayload } from '../interfaces/auth.interface.js';
import { IUserResponse } from '../interfaces/user.interface.js';
import { UnauthorizedError, NotFoundError, ConflictError } from '../errors/app-error.js';

export class AuthService {
  private userRepository: UserRepository;
  private roleRepository: RoleRepository;

  constructor() {
    this.userRepository = new UserRepository();
    this.roleRepository = new RoleRepository();
  }

  private generateAccessToken(payload: IJwtPayload): string {
    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.accessExpiration as any,
    });
  }

  private generateRefreshToken(payload: IJwtPayload): string {
    return jwt.sign(payload, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiration as any,
    });
  }

  public toUserResponse(user: any): IUserResponse {
    return {
      id: user.id,
      fullName: user.full_name,
      email: user.email,
      phone: user.phone || null,
      avatarUrl: user.avatar_url || null,
      status: user.status,
      role: {
        id: user.role_id,
        name: user.role_name,
        slug: user.role_slug,
        permissions: user.role_permissions || {},
      },
      companyId: user.company_id || null,
      companyName: user.company_name || null,
      complexId: user.complex_id || null,
      complexName: user.complex_name || null,
      residentId: user.resident_id || null,
      lastLogin: user.last_login,
      createdAt: user.created_at,
    };
  }

  public async login(email: string, password: string): Promise<{ loginResponse: ILoginResponse; refreshToken: string }> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (user.status !== 'active') {
      throw new UnauthorizedError('Account is inactive or suspended. Please contact Super Admin.');
    }

    await this.userRepository.updateLastLogin(user.id);

    const jwtPayload: IJwtPayload = {
      userId: user.id,
      email: user.email,
      roleId: user.role_id,
      roleSlug: user.role_slug,
      companyId: user.company_id || null,
      complexId: user.complex_id || null,
      residentId: user.resident_id || null,
    };

    const accessToken = this.generateAccessToken(jwtPayload);
    const refreshToken = this.generateRefreshToken(jwtPayload);

    const userResponse = this.toUserResponse(user);

    return {
      loginResponse: {
        user: userResponse,
        accessToken,
      },
      refreshToken,
    };
  }

  public async refresh(refreshToken: string): Promise<ILoginResponse> {
    if (!refreshToken) {
      throw new UnauthorizedError('Refresh token is required');
    }

    try {
      const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as IJwtPayload;
      const user = await this.userRepository.findById(decoded.userId);

      if (!user || user.status !== 'active') {
        throw new UnauthorizedError('User session expired or user is inactive');
      }

      const jwtPayload: IJwtPayload = {
        userId: user.id,
        email: user.email,
        roleId: user.role_id,
        roleSlug: user.role_slug,
        companyId: user.company_id || null,
        complexId: user.complex_id || null,
        residentId: user.resident_id || null,
      };

      const newAccessToken = this.generateAccessToken(jwtPayload);
      const userResponse = this.toUserResponse(user);

      return {
        user: userResponse,
        accessToken: newAccessToken,
      };
    } catch (error) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }
  }

  public async getCurrentUser(userId: string): Promise<IUserResponse> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError(`User with ID '${userId}' not found`);
    }
    return this.toUserResponse(user);
  }

  public async getAllUsers() {
    const users = await this.userRepository.findAllUsers();
    return users.map((u) => ({
      id: u.id,
      fullName: u.full_name,
      email: u.email,
      roleName: u.role_name,
      roleSlug: u.role_slug,
      complexId: u.complex_id,
    }));
  }

  public async createUser(data: {
    fullName: string;
    email: string;
    phone?: string | null;
    password?: string;
    roleSlug: string;
    companyId?: string | null;
    complexId?: string | null;
  }): Promise<IUserResponse> {
    const existing = await this.userRepository.findByEmail(data.email);
    if (existing) {
      throw new ConflictError(`User with email '${data.email}' already exists`);
    }

    const role = await this.roleRepository.findBySlug(data.roleSlug);
    if (!role) {
      throw new NotFoundError(`Role '${data.roleSlug}' not found`);
    }

    const passwordHash = await bcrypt.hash(data.password || 'Temp@123#', 10);

    const newUser = await this.userRepository.create({
      full_name: data.fullName,
      email: data.email,
      phone: data.phone || null,
      password_hash: passwordHash,
      role_id: role.id,
      company_id: data.companyId || null,
      complex_id: data.complexId || null,
      status: 'active',
    });

    const userWithDetails = await this.userRepository.findById(newUser.id);
    return this.toUserResponse(userWithDetails!);
  }
}
