import { CompanyRepository } from '../repositories/company.repository.js';
import { ActivityLogService } from './activity-log.service.js';
import { ICompany, ICompanyResponse } from '../interfaces/company.interface.js';
import { CreateCompanyDto, UpdateCompanyDto } from '../validators/company.validator.js';
import { ConflictError, NotFoundError } from '../errors/app-error.js';

export class CompanyService {
  private companyRepository: CompanyRepository;
  private activityLogService: ActivityLogService;

  constructor() {
    this.companyRepository = new CompanyRepository();
    this.activityLogService = new ActivityLogService();
  }

  public toResponse(company: ICompany): ICompanyResponse {
    return {
      id: company.id,
      name: company.name,
      slug: company.slug,
      logoUrl: company.logo_url,
      address: company.address,
      city: company.city,
      state: company.state,
      country: company.country,
      postalCode: company.postal_code,
      phone: company.phone,
      email: company.email,
      website: company.website,
      isActive: company.is_active,
      settings: company.settings,
      createdAt: company.created_at,
      updatedAt: company.updated_at,
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

  public async getAllCompanies(): Promise<ICompanyResponse[]> {
    const companies = await this.companyRepository.findAll();
    return companies.map((c) => this.toResponse(c));
  }

  public async getCompanyById(id: string): Promise<ICompanyResponse> {
    const company = await this.companyRepository.findById(id);
    if (!company) {
      throw new NotFoundError(`Company with ID '${id}' not found`);
    }
    return this.toResponse(company);
  }

  public async createCompany(
    data: CreateCompanyDto,
    userId: string,
    ipAddress?: string | null,
    userAgent?: string | null
  ): Promise<ICompanyResponse> {
    const existingName = await this.companyRepository.findByName(data.name);
    if (existingName) {
      throw new ConflictError(`Company with name '${data.name}' already exists`);
    }

    const slug = this.generateSlug(data.name);
    const existingSlug = await this.companyRepository.findBySlug(slug);
    if (existingSlug) {
      throw new ConflictError(`Company slug '${slug}' already in use`);
    }

    const newCompany = await this.companyRepository.create({
      name: data.name,
      slug,
      logo_url: data.logoUrl || null,
      address: data.address || null,
      city: data.city || null,
      state: data.state || null,
      country: data.country || 'India',
      postal_code: data.postalCode || null,
      phone: data.phone || null,
      email: data.email || null,
      website: data.website || null,
      settings: data.settings || {},
      is_active: true,
    });

    await this.activityLogService.log({
      companyId: newCompany.id,
      userId,
      action: 'create',
      entityType: 'companies',
      entityId: newCompany.id,
      description: `Created company '${newCompany.name}'`,
      newValues: this.toResponse(newCompany),
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
    });

    return this.toResponse(newCompany);
  }

  public async updateCompany(
    id: string,
    data: UpdateCompanyDto,
    userId: string,
    ipAddress?: string | null,
    userAgent?: string | null
  ): Promise<ICompanyResponse> {
    const existing = await this.companyRepository.findById(id);
    if (!existing) {
      throw new NotFoundError(`Company with ID '${id}' not found`);
    }

    let newSlug = existing.slug;
    if (data.name && data.name !== existing.name) {
      const nameCheck = await this.companyRepository.findByName(data.name);
      if (nameCheck && nameCheck.id !== id) {
        throw new ConflictError(`Company name '${data.name}' already exists`);
      }
      newSlug = this.generateSlug(data.name);
    }

    const updated = await this.companyRepository.update(id, {
      name: data.name,
      slug: newSlug,
      logo_url: data.logoUrl,
      address: data.address,
      city: data.city,
      state: data.state,
      country: data.country,
      postal_code: data.postalCode,
      phone: data.phone,
      email: data.email,
      website: data.website,
      is_active: data.isActive,
      settings: data.settings,
    });

    if (!updated) {
      throw new NotFoundError('Company update failed');
    }

    await this.activityLogService.log({
      companyId: updated.id,
      userId,
      action: 'update',
      entityType: 'companies',
      entityId: updated.id,
      description: `Updated company '${updated.name}'`,
      oldValues: this.toResponse(existing),
      newValues: this.toResponse(updated),
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
    });

    return this.toResponse(updated);
  }

  public async deleteCompany(
    id: string,
    userId: string,
    ipAddress?: string | null,
    userAgent?: string | null
  ): Promise<void> {
    const existing = await this.companyRepository.findById(id);
    if (!existing) {
      throw new NotFoundError(`Company with ID '${id}' not found`);
    }

    await this.companyRepository.softDelete(id);

    await this.activityLogService.log({
      companyId: id,
      userId,
      action: 'delete',
      entityType: 'companies',
      entityId: id,
      description: `Deleted company '${existing.name}'`,
      oldValues: this.toResponse(existing),
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
    });
  }
}
