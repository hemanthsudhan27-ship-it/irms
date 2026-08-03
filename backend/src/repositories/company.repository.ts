import { query } from '../database/index.js';
import { ICompany } from '../interfaces/company.interface.js';

export class CompanyRepository {
  async findAll(): Promise<ICompany[]> {
    const res = await query<ICompany>(
      `SELECT * FROM companies WHERE deleted_at IS NULL ORDER BY name ASC`
    );
    return res.rows;
  }

  async findById(id: string): Promise<ICompany | null> {
    const res = await query<ICompany>(
      `SELECT * FROM companies WHERE id = $1 AND deleted_at IS NULL`,
      [id]
    );
    return res.rows[0] || null;
  }

  async findByName(name: string): Promise<ICompany | null> {
    const res = await query<ICompany>(
      `SELECT * FROM companies WHERE LOWER(name) = LOWER($1) AND deleted_at IS NULL`,
      [name]
    );
    return res.rows[0] || null;
  }

  async findBySlug(slug: string): Promise<ICompany | null> {
    const res = await query<ICompany>(
      `SELECT * FROM companies WHERE slug = $1 AND deleted_at IS NULL`,
      [slug]
    );
    return res.rows[0] || null;
  }

  async create(data: Partial<ICompany>): Promise<ICompany> {
    const res = await query<ICompany>(
      `INSERT INTO companies (
        name, slug, logo_url, address, city, state, country, postal_code, phone, email, website, is_active, settings
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        data.name,
        data.slug,
        data.logo_url || null,
        data.address || null,
        data.city || null,
        data.state || null,
        data.country || 'India',
        data.postal_code || null,
        data.phone || null,
        data.email || null,
        data.website || null,
        data.is_active ?? true,
        data.settings ? JSON.stringify(data.settings) : '{}',
      ]
    );
    return res.rows[0];
  }

  async update(id: string, data: Partial<ICompany>): Promise<ICompany | null> {
    const fields: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    const allowedKeys: (keyof ICompany)[] = [
      'name', 'slug', 'logo_url', 'address', 'city', 'state', 'country',
      'postal_code', 'phone', 'email', 'website', 'is_active', 'settings'
    ];

    for (const key of allowedKeys) {
      if (data[key] !== undefined) {
        fields.push(`${key} = $${paramIndex++}`);
        params.push(key === 'settings' ? JSON.stringify(data[key]) : data[key]);
      }
    }

    if (fields.length === 0) return this.findById(id);

    fields.push(`updated_at = NOW()`);
    params.push(id);

    const res = await query<ICompany>(
      `UPDATE companies SET ${fields.join(', ')} WHERE id = $${paramIndex} AND deleted_at IS NULL RETURNING *`,
      params
    );
    return res.rows[0] || null;
  }

  async softDelete(id: string): Promise<boolean> {
    const res = await query(
      `UPDATE companies SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1 AND deleted_at IS NULL`,
      [id]
    );
    return (res.rowCount || 0) > 0;
  }
}
