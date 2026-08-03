import { Request, Response } from 'express';
import { FloorService } from '../services/floor.service.js';
import { asyncHandler } from '../utils/async-handler.js';
import { createFloorSchema, updateFloorSchema } from '../validators/floor.validator.js';
import { ValidationError } from '../errors/app-error.js';
import { IAuthenticatedRequest } from '../interfaces/auth.interface.js';

export class FloorController {
  private floorService: FloorService;

  constructor() {
    this.floorService = new FloorService();
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

  public getByComplex = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const complexId = String(req.params.complexId || req.query.complexId || '');
    const floors = await this.floorService.getFloorsByComplex(complexId);
    res.status(200).json({
      success: true,
      data: floors,
    });
  });

  public getById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = String(req.params.id);
    const floor = await this.floorService.getFloorById(id);
    res.status(200).json({
      success: true,
      data: floor,
    });
  });

  public create = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const authReq = req as IAuthenticatedRequest;
    const parseResult = createFloorSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new ValidationError('Validation failed', parseResult.error.flatten().fieldErrors);
    }

    const userId = authReq.user!.userId;
    const ip = this.getClientIp(req);
    const ua = this.getUserAgent(req);

    const floor = await (this.floorService.createFloor as any)(
      parseResult.data,
      userId,
      ip,
      ua
    );

    res.status(201).json({
      success: true,
      message: 'Floor created successfully',
      data: floor,
    });
  });

  public update = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const authReq = req as IAuthenticatedRequest;
    const id = String(req.params.id);
    const parseResult = updateFloorSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new ValidationError('Validation failed', parseResult.error.flatten().fieldErrors);
    }

    const userId = authReq.user!.userId;
    const ip = this.getClientIp(req);
    const ua = this.getUserAgent(req);

    const floor = await (this.floorService.updateFloor as any)(
      id,
      parseResult.data,
      userId,
      ip,
      ua
    );

    res.status(200).json({
      success: true,
      message: 'Floor updated successfully',
      data: floor,
    });
  });

  public delete = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const authReq = req as IAuthenticatedRequest;
    const id = String(req.params.id);
    const userId = authReq.user!.userId;
    const ip = this.getClientIp(req);
    const ua = this.getUserAgent(req);

    await (this.floorService.deleteFloor as any)(id, userId, ip, ua);

    res.status(200).json({
      success: true,
      message: 'Floor deleted successfully',
    });
  });
}
