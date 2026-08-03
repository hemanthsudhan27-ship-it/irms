import { Request, Response } from 'express';
import { ResidentService } from '../services/resident.service.js';
import { asyncHandler } from '../utils/async-handler.js';
import {
  createResidentSchema,
  updateResidentSchema,
  moveOutResidentSchema,
} from '../validators/resident.validator.js';
import { ValidationError } from '../errors/app-error.js';
import { IAuthenticatedRequest } from '../interfaces/auth.interface.js';

export class ResidentController {
  private residentService: ResidentService;

  constructor() {
    this.residentService = new ResidentService();
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

  public getAll = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const authReq = req as IAuthenticatedRequest;
    
    // For Complex Admin, force complexId restriction from JWT session
    let complexId: string | undefined = undefined;
    if (authReq.user?.roleSlug === 'complex_admin') {
      complexId = authReq.user.complexId || undefined;
    } else {
      complexId = typeof req.query.complexId === 'string' ? req.query.complexId : undefined;
    }

    const filters = {
      complexId,
      floorId: typeof req.query.floorId === 'string' ? req.query.floorId : undefined,
      unitId: typeof req.query.unitId === 'string' ? req.query.unitId : undefined,
      status: typeof req.query.status === 'string' ? req.query.status : undefined,
      search: typeof req.query.search === 'string' ? req.query.search : undefined,
      page: req.query.page ? parseInt(String(req.query.page), 10) : 1,
      limit: req.query.limit ? parseInt(String(req.query.limit), 10) : 20,
    };

    const result = await this.residentService.getResidents(filters);
    res.status(200).json({
      success: true,
      data: result.residents,
      pagination: result.pagination,
    });
  });

  public getById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = String(req.params.id);
    const resident = await this.residentService.getResidentById(id);
    res.status(200).json({
      success: true,
      data: resident,
    });
  });

  public create = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const authReq = req as IAuthenticatedRequest;
    const parseResult = createResidentSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new ValidationError('Validation failed', parseResult.error.flatten().fieldErrors);
    }

    const userId = authReq.user!.userId;
    const ip = this.getClientIp(req);
    const ua = this.getUserAgent(req);

    const resident = await (this.residentService.createResident as any)(
      parseResult.data,
      userId,
      ip,
      ua
    );

    res.status(201).json({
      success: true,
      message: 'Resident registered successfully',
      data: resident,
    });
  });

  public update = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const authReq = req as IAuthenticatedRequest;
    const id = String(req.params.id);
    const parseResult = updateResidentSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new ValidationError('Validation failed', parseResult.error.flatten().fieldErrors);
    }

    const userId = authReq.user!.userId;
    const ip = this.getClientIp(req);
    const ua = this.getUserAgent(req);

    const resident = await (this.residentService.updateResident as any)(
      id,
      parseResult.data,
      userId,
      ip,
      ua
    );

    res.status(200).json({
      success: true,
      message: 'Resident updated successfully',
      data: resident,
    });
  });

  public moveOut = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const authReq = req as IAuthenticatedRequest;
    const id = String(req.params.id);
    const parseResult = moveOutResidentSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new ValidationError('Validation failed', parseResult.error.flatten().fieldErrors);
    }

    const userId = authReq.user!.userId;
    const ip = this.getClientIp(req);
    const ua = this.getUserAgent(req);

    const resident = await (this.residentService.moveOutResident as any)(
      id,
      parseResult.data.moveOutDate || new Date(),
      userId,
      ip,
      ua
    );

    res.status(200).json({
      success: true,
      message: 'Resident move-out processed successfully',
      data: resident,
    });
  });

  public delete = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const authReq = req as IAuthenticatedRequest;
    const id = String(req.params.id);
    const userId = authReq.user!.userId;
    const ip = this.getClientIp(req);
    const ua = this.getUserAgent(req);

    await (this.residentService.deleteResident as any)(id, userId, ip, ua);

    res.status(200).json({
      success: true,
      message: 'Resident record deleted successfully',
    });
  });
}
