import { Request, Response } from 'express';
import { CompanyService } from '../services/company.service.js';
import { asyncHandler } from '../utils/async-handler.js';
import { createCompanySchema, updateCompanySchema } from '../validators/company.validator.js';
import { ValidationError } from '../errors/app-error.js';
import { IAuthenticatedRequest } from '../interfaces/auth.interface.js';

export class CompanyController {
  private companyService: CompanyService;

  constructor() {
    this.companyService = new CompanyService();
  }

  private getUserAgent(req: Request): string | undefined {
    const ua = req.headers['user-agent'];
    if (!ua) return undefined;
    if (Array.isArray(ua)) return ua[0];
    return String(ua);
  }

  private getClientIp(req: Request): string | undefined {
    const ip = req.ip;
    if (!ip) return undefined;
    if (Array.isArray(ip)) return ip[0];
    return String(ip);
  }

  public getAll = asyncHandler(async (_req, res) => {
    const companies = await this.companyService.getAllCompanies();
    res.status(200).json({
      success: true,
      data: companies,
    });
  });

  public getById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const company = await this.companyService.getCompanyById(id);
    res.status(200).json({
      success: true,
      data: company,
    });
  });

  public create = asyncHandler(async (req, res) => {
    const authReq = req as IAuthenticatedRequest;
    const parseResult = createCompanySchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new ValidationError('Validation failed', parseResult.error.flatten().fieldErrors);
    }

    const userId = authReq.user!.userId;
    const ip = this.getClientIp(req);
    const ua = this.getUserAgent(req);

    const company = await (this.companyService.createCompany as any)(
      parseResult.data,
      userId,
      ip,
      ua
    );

    res.status(201).json({
      success: true,
      message: 'Company created successfully',
      data: company,
    });
  });

  public update = asyncHandler(async (req, res) => {
    const authReq = req as IAuthenticatedRequest;
    const { id } = req.params;
    const parseResult = updateCompanySchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new ValidationError('Validation failed', parseResult.error.flatten().fieldErrors);
    }

    const userId = authReq.user!.userId;
    const ip = this.getClientIp(req);
    const ua = this.getUserAgent(req);

    const company = await (this.companyService.updateCompany as any)(
      id,
      parseResult.data,
      userId,
      ip,
      ua
    );

    res.status(200).json({
      success: true,
      message: 'Company updated successfully',
      data: company,
    });
  });

  public delete = asyncHandler(async (req, res) => {
    const authReq = req as IAuthenticatedRequest;
    const { id } = req.params;
    const userId = authReq.user!.userId;
    const ip = this.getClientIp(req);
    const ua = this.getUserAgent(req);

    await (this.companyService.deleteCompany as any)(id, userId, ip, ua);

    res.status(200).json({
      success: true,
      message: 'Company deleted successfully',
    });
  });
}
