import { ComplexRepository } from '../repositories/complex.repository.js';
import { CompanyRepository } from '../repositories/company.repository.js';
import { UserRepository } from '../repositories/user.repository.js';
import { RoleRepository } from '../repositories/role.repository.js';
import { ActivityLogService } from './activity-log.service.js';
import { withTransaction } from '../database/index.js';
import { IComplexWithDetails, IComplexResponse } from '../interfaces/complex.interface.js';
import { CreateComplexDto, UpdateComplexDto } from '../validators/complex.validator.js';
import { ConflictError, NotFoundError, BadRequestError } from '../errors/app-error.js';

export class ComplexService {
  private complexRepository: ComplexRepository;
  private companyRepository: CompanyRepository;
  private userRepository: UserRepository;
  private roleRepository: RoleRepository;
  private activityLogService: ActivityLogService;

  constructor() {
    this.complexRepository = new ComplexRepository();
    this.companyRepository = new CompanyRepository();
    this.userRepository = new UserRepository();
    this.roleRepository = new RoleRepository();
    this.activityLogService = new ActivityLogService();
  }

  public toResponse(complex: IComplexWithDetails): IComplexResponse {
    return {
      id: complex.id,
      companyId: complex.company_id,
      companyName: complex.company_name,
      name: complex.name,
      slug: complex.slug,
      code: complex.code,
      address: complex.address,
      city: complex.city,
      state: complex.state,
      country: complex.country,
      postalCode: complex.postal_code,
      phone: complex.phone,
      email: complex.email,
      totalFloors: complex.total_floors,
      totalUnits: complex.total_units,
      status: complex.status,
      amenities: complex.amenities || [],
      settings: complex.settings || {},
      assignedAdmin: complex.assigned_admin_id
        ? {
            id: complex.assigned_admin_id,
            name: complex.assigned_admin_name || '',
            email: complex.assigned_admin_email || '',
          }
        : null,
      createdAt: complex.created_at,
      updatedAt: complex.updated_at,
    };
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  public async getAllComplexes(companyId?: string): Promise<IComplexResponse[]> {
    const complexes = companyId
      ? await this.complexRepository.findByCompanyId(companyId)
      : await this.complexRepository.findAll();

    return complexes.map((c) => this.toResponse(c));
  }

  public async getComplexById(id: string): Promise<IComplexResponse> {
    const complex = await this.complexRepository.findById(id);
    if (!complex) {
      throw new NotFoundError(`Apartment Complex with ID '${id}' not found`);
    }
    return this.toResponse(complex);
  }

  public async createComplex(
    data: CreateComplexDto,
    userId: string,
    ipAddress?: string | null,
    userAgent?: string | null
  ): Promise<IComplexResponse> {
    const company = await this.companyRepository.findById(data.companyId);
    if (!company) {
      throw new NotFoundError(`Company with ID '${data.companyId}' not found`);
    }

    const existingName = await this.complexRepository.findByNameAndCompany(data.companyId, data.name);
    if (existingName) {
      throw new ConflictError(`Complex with name '${data.name}' already exists in this company`);
    }

    const baseSlug = this.generateSlug(data.name);
    let slug = baseSlug;
    const existingSlug = await this.complexRepository.findBySlug(slug);
    if (existingSlug) {
      slug = `${baseSlug}-${Date.now().toString(36)}`;
    }

    const newComplex = await this.complexRepository.create({
      company_id: data.companyId,
      name: data.name,
      slug,
      code: data.code || data.name.substring(0, 5).toUpperCase(),
      address: data.address || null,
      city: data.city || null,
      state: data.state || null,
      country: data.country || 'India',
      postal_code: data.postalCode || null,
      phone: data.phone || null,
      email: data.email || null,
      status: 'active',
      amenities: data.amenities || [],
      settings: data.settings || {},
    });

    const fullComplex = await this.complexRepository.findById(newComplex.id);

    await this.activityLogService.log({
      companyId: data.companyId,
      complexId: newComplex.id,
      userId,
      action: 'create',
      entityType: 'complexes',
      entityId: newComplex.id,
      description: `Created apartment complex '${newComplex.name}'`,
      newValues: this.toResponse(fullComplex!),
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
    });

    return this.toResponse(fullComplex!);
  }

  public async updateComplex(
    id: string,
    data: UpdateComplexDto,
    userId: string,
    ipAddress?: string | null,
    userAgent?: string | null
  ): Promise<IComplexResponse> {
    const existing = await this.complexRepository.findById(id);
    if (!existing) {
      throw new NotFoundError(`Apartment Complex with ID '${id}' not found`);
    }

    let slug = existing.slug;
    if (data.name && data.name !== existing.name) {
      const nameCheck = await this.complexRepository.findByNameAndCompany(existing.company_id, data.name);
      if (nameCheck && nameCheck.id !== id) {
        throw new ConflictError(`Complex with name '${data.name}' already exists in this company`);
      }
      slug = this.generateSlug(data.name);
    }

    await this.complexRepository.update(id, {
      name: data.name,
      slug,
      code: data.code,
      address: data.address,
      city: data.city,
      state: data.state,
      country: data.country,
      postal_code: data.postalCode,
      phone: data.phone,
      email: data.email,
      amenities: data.amenities,
      settings: data.settings,
    });

    const updated = await this.complexRepository.findById(id);

    await this.activityLogService.log({
      companyId: existing.company_id,
      complexId: id,
      userId,
      action: 'update',
      entityType: 'complexes',
      entityId: id,
      description: `Updated complex details for '${updated!.name}'`,
      oldValues: this.toResponse(existing),
      newValues: this.toResponse(updated!),
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
    });

    return this.toResponse(updated!);
  }

  public async renameComplex(
    id: string,
    newName: string,
    userId: string,
    ipAddress?: string | null,
    userAgent?: string | null
  ): Promise<IComplexResponse> {
    return this.updateComplex(id, { name: newName }, userId, ipAddress, userAgent);
  }

  public async deleteComplex(
    id: string,
    userId: string,
    ipAddress?: string | null,
    userAgent?: string | null
  ): Promise<void> {
    const existing = await this.complexRepository.findById(id);
    if (!existing) {
      throw new NotFoundError(`Apartment Complex with ID '${id}' not found`);
    }

    await this.complexRepository.softDelete(id);

    await this.activityLogService.log({
      companyId: existing.company_id,
      complexId: id,
      userId,
      action: 'delete',
      entityType: 'complexes',
      entityId: id,
      description: `Deleted apartment complex '${existing.name}'`,
      oldValues: this.toResponse(existing),
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
    });
  }

  public async assignComplexAdmin(
    complexId: string,
    adminUserId: string,
    userId: string,
    ipAddress?: string | null,
    userAgent?: string | null
  ): Promise<IComplexResponse> {
    const complex = await this.complexRepository.findById(complexId);
    if (!complex) {
      throw new NotFoundError(`Apartment Complex with ID '${complexId}' not found`);
    }

    const targetUser = await this.userRepository.findById(adminUserId);
    if (!targetUser) {
      throw new NotFoundError(`User with ID '${adminUserId}' not found`);
    }

    if (targetUser.role_slug !== 'complex_admin') {
      throw new BadRequestError(`User '${targetUser.full_name}' does not have the 'Complex Admin' role`);
    }

    await withTransaction(async (client) => {
      await client.query(
        `UPDATE users SET complex_id = NULL, updated_at = NOW() 
         WHERE complex_id = $1 AND role_id = (SELECT id FROM roles WHERE slug = 'complex_admin' LIMIT 1)`,
        [complexId]
      );

      await client.query(
        `UPDATE users SET complex_id = $1, company_id = $2, updated_at = NOW() WHERE id = $3`,
        [complexId, complex.company_id, adminUserId]
      );
    });

    const updatedComplex = await this.complexRepository.findById(complexId);

    await this.activityLogService.log({
      companyId: complex.company_id,
      complexId: complex.id,
      userId,
      action: 'assign',
      entityType: 'complexes',
      entityId: complex.id,
      description: `Assigned user '${targetUser.full_name}' as Complex Admin for '${complex.name}'`,
      oldValues: this.toResponse(complex),
      newValues: this.toResponse(updatedComplex!),
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
    });

    return this.toResponse(updatedComplex!);
  }
}
