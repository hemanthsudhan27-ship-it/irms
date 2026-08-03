import { query } from '../database/index.js';
import { IApartmentUnit, IApartmentUnitDisplay } from '../interfaces/unit.interface.js';

export class UnitRepository {
  async findByFloorId(floorId: string): Promise<IApartmentUnitDisplay[]> {
    const res = await query<IApartmentUnitDisplay>(
      `SELECT * FROM apartment_units_display WHERE floor_id = $1 AND deleted_at IS NULL ORDER BY unit_number ASC`,
      [floorId]
    );
    return res.rows;
  }

  async findByComplexId(complexId: string): Promise<IApartmentUnitDisplay[]> {
    const res = await query<IApartmentUnitDisplay>(
      `SELECT * FROM apartment_units_display WHERE complex_id = $1 AND deleted_at IS NULL ORDER BY floor_number ASC, unit_number ASC`,
      [complexId]
    );
    return res.rows;
  }

  async findById(id: string): Promise<IApartmentUnitDisplay | null> {
    const res = await query<IApartmentUnitDisplay>(
      `SELECT * FROM apartment_units_display WHERE id = $1 AND deleted_at IS NULL`,
      [id]
    );
    return res.rows[0] || null;
  }

  async findByUnitNumber(floorId: string, unitNumber: string): Promise<IApartmentUnit | null> {
    const res = await query<IApartmentUnit>(
      `SELECT * FROM apartment_units WHERE floor_id = $1 AND LOWER(unit_number) = LOWER($2) AND deleted_at IS NULL`,
      [floorId, unitNumber]
    );
    return res.rows[0] || null;
  }

  async create(data: Partial<IApartmentUnit>): Promise<IApartmentUnit> {
    const res = await query<IApartmentUnit>(
      `INSERT INTO apartment_units (
        floor_id, unit_number, capacity, status, unit_type, area_sqft, rent_amount, deposit_amount, description, amenities, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        data.floor_id,
        data.unit_number,
        data.capacity || 1,
        data.status || 'available',
        data.unit_type || null,
        data.area_sqft || null,
        data.rent_amount || null,
        data.deposit_amount || null,
        data.description || null,
        data.amenities ? JSON.stringify(data.amenities) : '[]',
        data.metadata ? JSON.stringify(data.metadata) : '{}',
      ]
    );

    // Sync total_units on floor
    await query(
      `UPDATE floors SET total_units = (
        SELECT COUNT(*) FROM apartment_units WHERE floor_id = $1 AND deleted_at IS NULL
      ), updated_at = NOW() WHERE id = $1`,
      [data.floor_id]
    );

    // Sync total_units on complex
    await query(
      `UPDATE complexes SET total_units = (
        SELECT COUNT(*) FROM apartment_units au
        JOIN floors f ON au.floor_id = f.id
        WHERE f.complex_id = (SELECT complex_id FROM floors WHERE id = $1) AND au.deleted_at IS NULL
      ), updated_at = NOW() WHERE id = (SELECT complex_id FROM floors WHERE id = $1)`,
      [data.floor_id]
    );

    return res.rows[0];
  }

  async update(id: string, data: Partial<IApartmentUnit>): Promise<IApartmentUnit | null> {
    const fields: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    const allowedKeys: (keyof IApartmentUnit)[] = [
      'unit_number', 'capacity', 'occupancy_count', 'status', 'unit_type',
      'area_sqft', 'rent_amount', 'deposit_amount', 'description', 'amenities', 'metadata'
    ];

    for (const key of allowedKeys) {
      if (data[key] !== undefined) {
        fields.push(`${key} = $${paramIndex++}`);
        if (key === 'amenities' || key === 'metadata') {
          params.push(JSON.stringify(data[key]));
        } else {
          params.push(data[key]);
        }
      }
    }

    if (fields.length === 0) return this.findById(id);

    fields.push(`updated_at = NOW()`);
    params.push(id);

    const res = await query<IApartmentUnit>(
      `UPDATE apartment_units SET ${fields.join(', ')} WHERE id = $${paramIndex} AND deleted_at IS NULL RETURNING *`,
      params
    );
    return res.rows[0] || null;
  }

  async softDelete(id: string, floorId: string): Promise<boolean> {
    const res = await query(
      `UPDATE apartment_units SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1 AND deleted_at IS NULL`,
      [id]
    );

    // Sync total_units on floor
    await query(
      `UPDATE floors SET total_units = (
        SELECT COUNT(*) FROM apartment_units WHERE floor_id = $1 AND deleted_at IS NULL
      ), updated_at = NOW() WHERE id = $1`,
      [floorId]
    );

    return (res.rowCount || 0) > 0;
  }
}
