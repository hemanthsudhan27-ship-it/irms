import { query } from '../database/index.js';
import { IActivityLog, ICreateActivityLogDto } from '../interfaces/activity-log.interface.js';

export class ActivityLogRepository {
  async create(logData: ICreateActivityLogDto): Promise<IActivityLog> {
    const res = await query<IActivityLog>(
      `INSERT INTO activity_logs (
        company_id, complex_id, user_id, action, entity_type, entity_id,
        description, old_values, new_values, ip_address, user_agent, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        logData.companyId || null,
        logData.complexId || null,
        logData.userId || null,
        logData.action,
        logData.entityType,
        logData.entityId || null,
        logData.description || null,
        logData.oldValues ? JSON.stringify(logData.oldValues) : null,
        logData.newValues ? JSON.stringify(logData.newValues) : null,
        logData.ipAddress || null,
        logData.userAgent || null,
        logData.metadata ? JSON.stringify(logData.metadata) : '{}',
      ]
    );
    return res.rows[0];
  }

  async findWithFilters(filters: {
    companyId?: string;
    complexId?: string;
    userId?: string;
    entityType?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ logs: IActivityLog[]; total: number }> {
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (filters.companyId) {
      conditions.push(`company_id = $${paramIndex++}`);
      params.push(filters.companyId);
    }

    if (filters.complexId) {
      conditions.push(`complex_id = $${paramIndex++}`);
      params.push(filters.complexId);
    }

    if (filters.userId) {
      conditions.push(`user_id = $${paramIndex++}`);
      params.push(filters.userId);
    }

    if (filters.entityType) {
      conditions.push(`entity_type = $${paramIndex++}`);
      params.push(filters.entityType);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await query<{ count: string }>(
      `SELECT COUNT(*) FROM activity_logs ${whereClause}`,
      params
    );
    const total = parseInt(countRes.rows[0].count, 10);

    const limit = filters.limit || 50;
    const offset = filters.offset || 0;

    params.push(limit, offset);
    const dataRes = await query<IActivityLog>(
      `SELECT * FROM activity_logs ${whereClause} ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      params
    );

    return { logs: dataRes.rows, total };
  }
}
