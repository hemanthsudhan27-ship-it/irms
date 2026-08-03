import { Request, Response } from 'express';
import { DashboardService } from '../services/dashboard.service.js';
import { asyncHandler } from '../utils/async-handler.js';
import { IAuthenticatedRequest } from '../interfaces/auth.interface.js';
import { ForbiddenError } from '../errors/app-error.js';

export class DashboardController {
  private dashboardService: DashboardService;

  constructor() {
    this.dashboardService = new DashboardService();
  }

  public getSuperAdminStats = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const stats = await this.dashboardService.getSuperAdminDashboard();
    res.status(200).json({
      success: true,
      data: stats,
    });
  });

  public getComplexAdminStats = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const authReq = req as IAuthenticatedRequest;
    const complexId = authReq.user?.complexId;
    if (!complexId) {
      throw new ForbiddenError('You are not assigned to any complex.');
    }

    const stats = await this.dashboardService.getComplexAdminDashboard(complexId);
    res.status(200).json({
      success: true,
      data: stats,
    });
  });
}
