import { ActivityLogRepository } from '../repositories/activity-log.repository.js';
import { ICreateActivityLogDto, IActivityLog } from '../interfaces/activity-log.interface.js';
import { logger } from '../utils/logger.js';

export class ActivityLogService {
  private logRepository: ActivityLogRepository;

  constructor() {
    this.logRepository = new ActivityLogRepository();
  }

  public async log(dto: ICreateActivityLogDto): Promise<IActivityLog | null> {
    try {
      return await this.logRepository.create(dto);
    } catch (err) {
      logger.error('Failed to record activity log:', err);
      return null;
    }
  }

  public async getLogs(filters: {
    companyId?: string;
    complexId?: string;
    userId?: string;
    entityType?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;

    const { logs, total } = await this.logRepository.findWithFilters({
      companyId: filters.companyId,
      complexId: filters.complexId,
      userId: filters.userId,
      entityType: filters.entityType,
      limit,
      offset,
    });

    return {
      logs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
