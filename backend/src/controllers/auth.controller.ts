import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service.js';
import { asyncHandler } from '../utils/async-handler.js';
import { loginSchema } from '../validators/auth.validator.js';
import { ValidationError } from '../errors/app-error.js';
import { IAuthenticatedRequest } from '../interfaces/auth.interface.js';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  public login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new ValidationError('Validation failed', parseResult.error.flatten().fieldErrors);
    }

    const { email, password } = parseResult.data;
    const { loginResponse, refreshToken } = await this.authService.login(email, password);

    // Set Refresh Token in HTTP-Only Cookie
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: loginResponse,
    });
  });

  public refresh = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const refreshToken = req.cookies?.refresh_token || req.body?.refreshToken;
    const result = await this.authService.refresh(refreshToken);

    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: result,
    });
  });

  public me = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const authReq = req as IAuthenticatedRequest;
    const userId = authReq.user!.userId;
    const user = await this.authService.getCurrentUser(userId);

    res.status(200).json({
      success: true,
      data: user,
    });
  });

  public getUsers = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const users = await this.authService.getAllUsers();
    res.status(200).json({
      success: true,
      data: users,
    });
  });

  public logout = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    res.clearCookie('refresh_token');
    res.clearCookie('access_token');

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  });
}
