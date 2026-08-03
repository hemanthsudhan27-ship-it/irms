import { query } from '../database/index.js';
import { IResident, IResidentWithDetails } from '../interfaces/resident.interface.js';

export class ResidentRepository {
  async findById(id: string): Promise<IResidentWithDetails | null> {
    const res = await query<IResidentWithDetails>(
      `SELECT r.*, 
              au.unit_number,
              cx.name || '-' || f.floor_label || au.unit_number AS unit_display_name,
              au.capacity,
              au.occupancy_count,
              f.id AS floor_id,
              f.floor_label,
              f.floor_number,
              cx.id AS complex_id,
              cx.name AS complex_name,
              cx.company_id
       FROM residents r
       JOIN apartment_units au ON r.unit_id = au.id
       JOIN floors f ON au.floor_id = f.id
       JOIN complexes cx ON f.complex_id = cx.id
       WHERE r.id = $1 AND r.deleted_at IS NULL`,
      [id]
    );
    return res.rows[0] || null;
  }

  async findWithFilters(filters: {
    complexId?: string;
    floorId?: string;
    unitId?: string;
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ residents: IResidentWithDetails[]; total: number }> {
    const conditions: string[] = ['r.deleted_at IS NULL'];
    const params: any[] = [];
    let paramIndex = 1;

    if (filters.complexId) {
      conditions.push(`cx.id = $${paramIndex++}`);
      params.push(filters.complexId);
    }

    if (filters.floorId) {
      conditions.push(`f.id = $${paramIndex++}`);
      params.push(filters.floorId);
    }

    if (filters.unitId) {
      conditions.push(`r.unit_id = $${paramIndex++}`);
      params.push(filters.unitId);
    }

    if (filters.status) {
      conditions.push(`r.status = $${paramIndex++}`);
      params.push(filters.status);
    }

    if (filters.search) {
      conditions.push(
        `(r.full_name ILIKE $${paramIndex} OR r.phone ILIKE $${paramIndex} OR r.email ILIKE $${paramIndex})`
      );
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const countRes = await query<{ count: string }>(
      `SELECT COUNT(*)
       FROM residents r
       JOIN apartment_units au ON r.unit_id = au.id
       JOIN floors f ON au.floor_id = f.id
       JOIN complexes cx ON f.complex_id = cx.id
       ${whereClause}`,
      params
    );
    const total = parseInt(countRes.rows[0].count, 10);

    const limit = filters.limit || 50;
    const offset = filters.offset || 0;

    params.push(limit, offset);
    const dataRes = await query<IResidentWithDetails>(
      `SELECT r.*, 
              au.unit_number,
              cx.name || '-' || f.floor_label || au.unit_number AS unit_display_name,
              au.capacity,
              au.occupancy_count,
              f.id AS floor_id,
              f.floor_label,
              f.floor_number,
              cx.id AS complex_id,
              cx.name AS complex_name,
              cx.company_id
       FROM residents r
       JOIN apartment_units au ON r.unit_id = au.id
       JOIN floors f ON au.floor_id = f.id
       JOIN complexes cx ON f.complex_id = cx.id
       ${whereClause}
       ORDER BY r.created_at DESC
       LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      params
    );

    return { residents: dataRes.rows, total };
  }

  async create(data: Partial<IResident>): Promise<IResident> {
    const res = await query<IResident>(
      `INSERT INTO residents (
        unit_id, user_id, full_name, email, phone, emergency_contact_name, emergency_contact_phone,
        move_in_date, move_out_date, status, id_proof_type, id_proof_number, id_proof_url, notes, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *`,
      [
        data.unit_id,
        data.user_id || null,
        data.full_name,
        data.email || null,
        data.phone,
        data.emergency_contact_name || null,
        data.emergency_contact_phone || null,
        data.move_in_date || new Date(),
        data.move_out_date || null,
        data.status || 'active',
        data.id_proof_type || null,
        data.id_proof_number || null,
        data.id_proof_url || null,
        data.notes || null,
        data.metadata ? JSON.stringify(data.metadata) : '{}',
      ]
    );
    return res.rows[0];
  }

  async update(id: string, data: Partial<IResident>): Promise<IResident | null> {
    const fields: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    const allowedKeys: (keyof IResident)[] = [
      'unit_id', 'user_id', 'full_name', 'email', 'phone', 'emergency_contact_name',
      'emergency_contact_phone', 'move_in_date', 'move_out_date', 'status',
      'id_proof_type', 'id_proof_number', 'id_proof_url', 'notes', 'metadata'
    ];

    for (const key of allowedKeys) {
      if (data[key] !== undefined) {
        fields.push(`${key} = $${paramIndex++}`);
        if (key === 'metadata') {
          params.push(JSON.stringify(data[key]));
        } else {
          params.push(data[key]);
        }
      }
    }

    if (fields.length === 0) return this.findById(id);

    fields.push(`updated_at = NOW()`);
    params.push(id);

    const res = await query<IResident>(
      `UPDATE residents SET ${fields.join(', ')} WHERE id = $${paramIndex} AND deleted_at IS NULL RETURNING *`,
      params
    );
    return res.rows[0] || null;
  }

  async softDelete(id: string): Promise<boolean> {
    const res = await query(
      `UPDATE residents SET status = 'moved_out', deleted_at = NOW(), updated_at = NOW() WHERE id = $1 AND deleted_at IS NULL`,
      [id]
    );
    return (res.rowCount || 0) > 0;
  }
}
