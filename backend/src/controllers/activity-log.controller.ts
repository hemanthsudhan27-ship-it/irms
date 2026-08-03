import { Request, Response } from 'express';
import { ActivityLogService } from '../services/activity-log.service.js';
import { asyncHandler } from '../utils/async-handler.js';
import { IAuthenticatedRequest } from '../interfaces/auth.interface.js';

export class ActivityLogController {
  private activityLogService: ActivityLogService;

  constructor() {
    this.activityLogService = new ActivityLogService();
  }

  public getLogs = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const authReq = req as IAuthenticatedRequest;

    let complexId: string | undefined = undefined;
    if (authReq.user?.roleSlug === 'complex_admin') {
      complexId = authReq.user.complexId || undefined;
    } else {
      complexId = typeof req.query.complexId === 'string' ? req.query.complexId : undefined;
    }

    const filters = {
      companyId: typeof req.query.companyId === 'string' ? req.query.companyId : undefined,
      complexId,
      userId: typeof req.query.userId === 'string' ? req.query.userId : undefined,
      entityType: typeof req.query.entityType === 'string' ? req.query.entityType : undefined,
      page: req.query.page ? parseInt(String(req.query.page), 10) : 1,
      limit: req.query.limit ? parseInt(String(req.query.limit), 10) : 20,
    };

    const result = await this.activityLogService.getLogs(filters);
    res.status(200).json({
      success: true,
      data: result.logs,
      pagination: result.pagination,
    });
  });
}
