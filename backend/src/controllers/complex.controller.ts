import { Request, Response } from 'express';
import { ComplexService } from '../services/complex.service.js';
import { asyncHandler } from '../utils/async-handler.js';
import {
  createComplexSchema,
  updateComplexSchema,
  renameComplexSchema,
  assignAdminSchema,
} from '../validators/complex.validator.js';
import { ValidationError, ForbiddenError } from '../errors/app-error.js';
import { IAuthenticatedRequest } from '../interfaces/auth.interface.js';

export class ComplexController {
  private complexService: ComplexService;

  constructor() {
    this.complexService = new ComplexService();
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

  public getAll = asyncHandler(async (req, res) => {
    const companyId = typeof req.query.companyId === 'string' ? req.query.companyId : undefined;
    const complexes = await this.complexService.getAllComplexes(companyId);
    res.status(200).json({
      success: true,
      data: complexes,
    });
  });

  public getById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const complex = await this.complexService.getComplexById(id);
    res.status(200).json({
      success: true,
      data: complex,
    });
  });

  public getMyComplex = asyncHandler(async (req, res) => {
    const authReq = req as IAuthenticatedRequest;
    const complexId = authReq.user!.complexId;
    if (!complexId) {
      throw new ForbiddenError('You are not assigned to any complex.');
    }
    const complex = await this.complexService.getComplexById(complexId);
    res.status(200).json({
      success: true,
      data: complex,
    });
  });

  public create = asyncHandler(async (req, res) => {
    const authReq = req as IAuthenticatedRequest;
    const parseResult = createComplexSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new ValidationError('Validation failed', parseResult.error.flatten().fieldErrors);
    }

    const userId = authReq.user!.userId;
    const ip = this.getClientIp(req);
    const ua = this.getUserAgent(req);

    const complex = await (this.complexService.createComplex as any)(
      parseResult.data,
      userId,
      ip,
      ua
    );

    res.status(201).json({
      success: true,
      message: 'Apartment complex created successfully',
      data: complex,
    });
  });

  public update = asyncHandler(async (req, res) => {
    const authReq = req as IAuthenticatedRequest;
    const { id } = req.params;
    const parseResult = updateComplexSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new ValidationError('Validation failed', parseResult.error.flatten().fieldErrors);
    }

    const userId = authReq.user!.userId;
    const ip = this.getClientIp(req);
    const ua = this.getUserAgent(req);

    const complex = await (this.complexService.updateComplex as any)(
      id,
      parseResult.data,
      userId,
      ip,
      ua
    );

    res.status(200).json({
      success: true,
      message: 'Apartment complex updated successfully',
      data: complex,
    });
  });

  public updateMyComplex = asyncHandler(async (req, res) => {
    const authReq = req as IAuthenticatedRequest;
    const complexId = authReq.user!.complexId;
    if (!complexId) {
      throw new ForbiddenError('You are not assigned to any complex.');
    }

    const parseResult = updateComplexSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new ValidationError('Validation failed', parseResult.error.flatten().fieldErrors);
    }

    const userId = authReq.user!.userId;
    const ip = this.getClientIp(req);
    const ua = this.getUserAgent(req);

    const complex = await (this.complexService.updateComplex as any)(
      complexId,
      parseResult.data,
      userId,
      ip,
      ua
    );

    res.status(200).json({
      success: true,
      message: 'Your complex details updated successfully',
      data: complex,
    });
  });

  public rename = asyncHandler(async (req, res) => {
    const authReq = req as IAuthenticatedRequest;
    const { id } = req.params;
    const parseResult = renameComplexSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new ValidationError('Validation failed', parseResult.error.flatten().fieldErrors);
    }

    const userId = authReq.user!.userId;
    const ip = this.getClientIp(req);
    const ua = this.getUserAgent(req);

    const complex = await (this.complexService.renameComplex as any)(
      id,
      parseResult.data.name,
      userId,
      ip,
      ua
    );

    res.status(200).json({
      success: true,
      message: 'Apartment complex renamed successfully',
      data: complex,
    });
  });

  public delete = asyncHandler(async (req, res) => {
    const authReq = req as IAuthenticatedRequest;
    const { id } = req.params;
    const userId = authReq.user!.userId;
    const ip = this.getClientIp(req);
    const ua = this.getUserAgent(req);

    await (this.complexService.deleteComplex as any)(id, userId, ip, ua);

    res.status(200).json({
      success: true,
      message: 'Apartment complex deleted successfully',
    });
  });

  public assignAdmin = asyncHandler(async (req, res) => {
    const authReq = req as IAuthenticatedRequest;
    const { id } = req.params;
    const parseResult = assignAdminSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new ValidationError('Validation failed', parseResult.error.flatten().fieldErrors);
    }

    const userId = authReq.user!.userId;
    const ip = this.getClientIp(req);
    const ua = this.getUserAgent(req);

    const complex = await (this.complexService.assignComplexAdmin as any)(
      id,
      parseResult.data.adminUserId,
      userId,
      ip,
      ua
    );

    res.status(200).json({
      success: true,
      message: 'Complex Admin assigned successfully',
      data: complex,
    });
  });
}
