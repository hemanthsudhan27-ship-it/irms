import { query } from '../database/index.js';
import { IFloor } from '../interfaces/floor.interface.js';

export class FloorRepository {
  async findByComplexId(complexId: string): Promise<IFloor[]> {
    const res = await query<IFloor>(
      `SELECT * FROM floors WHERE complex_id = $1 AND deleted_at IS NULL ORDER BY floor_number ASC`,
      [complexId]
    );
    return res.rows;
  }

  async findById(id: string): Promise<IFloor | null> {
    const res = await query<IFloor>(
      `SELECT * FROM floors WHERE id = $1 AND deleted_at IS NULL`,
      [id]
    );
    return res.rows[0] || null;
  }

  async findByFloorNumber(complexId: string, floorNumber: number): Promise<IFloor | null> {
    const res = await query<IFloor>(
      `SELECT * FROM floors WHERE complex_id = $1 AND floor_number = $2 AND deleted_at IS NULL`,
      [complexId, floorNumber]
    );
    return res.rows[0] || null;
  }

  async findByFloorLabel(complexId: string, floorLabel: string): Promise<IFloor | null> {
    const res = await query<IFloor>(
      `SELECT * FROM floors WHERE complex_id = $1 AND LOWER(floor_label) = LOWER($2) AND deleted_at IS NULL`,
      [complexId, floorLabel]
    );
    return res.rows[0] || null;
  }

  async create(data: Partial<IFloor>): Promise<IFloor> {
    const res = await query<IFloor>(
      `INSERT INTO floors (
        complex_id, floor_number, floor_label, description, is_active
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *`,
      [
        data.complex_id,
        data.floor_number,
        data.floor_label,
        data.description || null,
        data.is_active ?? true,
      ]
    );

    // Sync total_floors on complex
    await query(
      `UPDATE complexes SET total_floors = (
        SELECT COUNT(*) FROM floors WHERE complex_id = $1 AND deleted_at IS NULL
      ), updated_at = NOW() WHERE id = $1`,
      [data.complex_id]
    );

    return res.rows[0];
  }

  async update(id: string, data: Partial<IFloor>): Promise<IFloor | null> {
    const fields: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    const allowedKeys: (keyof IFloor)[] = ['floor_number', 'floor_label', 'description', 'is_active'];

    for (const key of allowedKeys) {
      if (data[key] !== undefined) {
        fields.push(`${key} = $${paramIndex++}`);
        params.push(data[key]);
      }
    }

    if (fields.length === 0) return this.findById(id);

    fields.push(`updated_at = NOW()`);
    params.push(id);

    const res = await query<IFloor>(
      `UPDATE floors SET ${fields.join(', ')} WHERE id = $${paramIndex} AND deleted_at IS NULL RETURNING *`,
      params
    );
    return res.rows[0] || null;
  }

  async softDelete(id: string, complexId: string): Promise<boolean> {
    const res = await query(
      `UPDATE floors SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1 AND deleted_at IS NULL`,
      [id]
    );

    // Sync total_floors on complex
    await query(
      `UPDATE complexes SET total_floors = (
        SELECT COUNT(*) FROM floors WHERE complex_id = $1 AND deleted_at IS NULL
      ), updated_at = NOW() WHERE id = $1`,
      [complexId]
    );

    return (res.rowCount || 0) > 0;
  }
}
