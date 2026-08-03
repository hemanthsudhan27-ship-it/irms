import { query } from '../database/index.js';
import { IComplex, IComplexWithDetails } from '../interfaces/complex.interface.js';

export class ComplexRepository {
  async findAll(): Promise<IComplexWithDetails[]> {
    const res = await query<IComplexWithDetails>(
      `SELECT c.*, 
              comp.name AS company_name,
              u.id AS assigned_admin_id,
              u.full_name AS assigned_admin_name,
              u.email AS assigned_admin_email
       FROM complexes c
       JOIN companies comp ON c.company_id = comp.id
       LEFT JOIN users u ON u.complex_id = c.id AND u.role_id = (SELECT id FROM roles WHERE slug = 'complex_admin' LIMIT 1) AND u.deleted_at IS NULL
       WHERE c.deleted_at IS NULL
       ORDER BY c.name ASC`
    );
    return res.rows;
  }

  async findByCompanyId(companyId: string): Promise<IComplexWithDetails[]> {
    const res = await query<IComplexWithDetails>(
      `SELECT c.*, 
              comp.name AS company_name,
              u.id AS assigned_admin_id,
              u.full_name AS assigned_admin_name,
              u.email AS assigned_admin_email
       FROM complexes c
       JOIN companies comp ON c.company_id = comp.id
       LEFT JOIN users u ON u.complex_id = c.id AND u.role_id = (SELECT id FROM roles WHERE slug = 'complex_admin' LIMIT 1) AND u.deleted_at IS NULL
       WHERE c.company_id = $1 AND c.deleted_at IS NULL
       ORDER BY c.name ASC`,
      [companyId]
    );
    return res.rows;
  }

  async findById(id: string): Promise<IComplexWithDetails | null> {
    const res = await query<IComplexWithDetails>(
      `SELECT c.*, 
              comp.name AS company_name,
              u.id AS assigned_admin_id,
              u.full_name AS assigned_admin_name,
              u.email AS assigned_admin_email
       FROM complexes c
       JOIN companies comp ON c.company_id = comp.id
       LEFT JOIN users u ON u.complex_id = c.id AND u.role_id = (SELECT id FROM roles WHERE slug = 'complex_admin' LIMIT 1) AND u.deleted_at IS NULL
       WHERE c.id = $1 AND c.deleted_at IS NULL`,
      [id]
    );
    return res.rows[0] || null;
  }

  async findByNameAndCompany(companyId: string, name: string): Promise<IComplex | null> {
    const res = await query<IComplex>(
      `SELECT * FROM complexes WHERE company_id = $1 AND LOWER(name) = LOWER($2) AND deleted_at IS NULL`,
      [companyId, name]
    );
    return res.rows[0] || null;
  }

  async findBySlug(slug: string): Promise<IComplex | null> {
    const res = await query<IComplex>(
      `SELECT * FROM complexes WHERE slug = $1 AND deleted_at IS NULL`,
      [slug]
    );
    return res.rows[0] || null;
  }

  async create(data: Partial<IComplex>): Promise<IComplex> {
    const res = await query<IComplex>(
      `INSERT INTO complexes (
        company_id, name, slug, code, address, city, state, country, postal_code, phone, email, status, amenities, settings
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
      [
        data.company_id,
        data.name,
        data.slug,
        data.code || null,
        data.address || null,
        data.city || null,
        data.state || null,
        data.country || 'India',
        data.postal_code || null,
        data.phone || null,
        data.email || null,
        data.status || 'active',
        data.amenities ? JSON.stringify(data.amenities) : '[]',
        data.settings ? JSON.stringify(data.settings) : '{}',
      ]
    );
    return res.rows[0];
  }

  async update(id: string, data: Partial<IComplex>): Promise<IComplex | null> {
    const fields: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    const allowedKeys: (keyof IComplex)[] = [
      'name', 'slug', 'code', 'address', 'city', 'state', 'country',
      'postal_code', 'phone', 'email', 'status', 'amenities', 'settings'
    ];

    for (const key of allowedKeys) {
      if (data[key] !== undefined) {
        fields.push(`${key} = $${paramIndex++}`);
        if (key === 'amenities' || key === 'settings') {
          params.push(JSON.stringify(data[key]));
        } else {
          params.push(data[key]);
        }
      }
    }

    if (fields.length === 0) return this.findById(id);

    fields.push(`updated_at = NOW()`);
    params.push(id);

    const res = await query<IComplex>(
      `UPDATE complexes SET ${fields.join(', ')} WHERE id = $${paramIndex} AND deleted_at IS NULL RETURNING *`,
      params
    );
    return res.rows[0] || null;
  }

  async softDelete(id: string): Promise<boolean> {
    const res = await query(
      `UPDATE complexes SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1 AND deleted_at IS NULL`,
      [id]
    );
    return (res.rowCount || 0) > 0;
  }
}
