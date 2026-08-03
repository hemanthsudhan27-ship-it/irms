import { Request, Response } from 'express';
import { UnitService } from '../services/unit.service.js';
import { asyncHandler } from '../utils/async-handler.js';
import { createUnitSchema, updateUnitSchema } from '../validators/unit.validator.js';
import { ValidationError } from '../errors/app-error.js';
import { IAuthenticatedRequest } from '../interfaces/auth.interface.js';

export class UnitController {
  private unitService: UnitService;

  constructor() {
    this.unitService = new UnitService();
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

  public getByFloor = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const floorId = String(req.params.floorId);
    const units = await this.unitService.getUnitsByFloor(floorId);
    res.status(200).json({
      success: true,
      data: units,
    });
  });

  public getByComplex = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const complexId = String(req.params.complexId || req.query.complexId || '');
    const units = await this.unitService.getUnitsByComplex(complexId);
    res.status(200).json({
      success: true,
      data: units,
    });
  });

  public getById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = String(req.params.id);
    const unit = await this.unitService.getUnitById(id);
    res.status(200).json({
      success: true,
      data: unit,
    });
  });

  public create = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const authReq = req as IAuthenticatedRequest;
    const parseResult = createUnitSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new ValidationError('Validation failed', parseResult.error.flatten().fieldErrors);
    }

    const userId = authReq.user!.userId;
    const ip = this.getClientIp(req);
    const ua = this.getUserAgent(req);

    const unit = await (this.unitService.createUnit as any)(
      parseResult.data,
      userId,
      ip,
      ua
    );

    res.status(201).json({
      success: true,
      message: 'Apartment unit created successfully',
      data: unit,
    });
  });

  public update = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const authReq = req as IAuthenticatedRequest;
    const id = String(req.params.id);
    const parseResult = updateUnitSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new ValidationError('Validation failed', parseResult.error.flatten().fieldErrors);
    }

    const userId = authReq.user!.userId;
    const ip = this.getClientIp(req);
    const ua = this.getUserAgent(req);

    const unit = await (this.unitService.updateUnit as any)(
      id,
      parseResult.data,
      userId,
      ip,
      ua
    );

    res.status(200).json({
      success: true,
      message: 'Apartment unit updated successfully',
      data: unit,
    });
  });

  public delete = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const authReq = req as IAuthenticatedRequest;
    const id = String(req.params.id);
    const userId = authReq.user!.userId;
    const ip = this.getClientIp(req);
    const ua = this.getUserAgent(req);

    await (this.unitService.deleteUnit as any)(id, userId, ip, ua);

    res.status(200).json({
      success: true,
      message: 'Apartment unit deleted successfully',
    });
  });
}
