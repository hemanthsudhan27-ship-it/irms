import { query } from '../database/index.js';
import { IRole } from '../interfaces/role.interface.js';

export class RoleRepository {
  async findById(id: string): Promise<IRole | null> {
    const res = await query<IRole>(
      `SELECT * FROM roles WHERE id = $1 AND deleted_at IS NULL`,
      [id]
    );
    return res.rows[0] || null;
  }

  async findBySlug(slug: string): Promise<IRole | null> {
    const res = await query<IRole>(
      `SELECT * FROM roles WHERE slug = $1 AND deleted_at IS NULL`,
      [slug]
    );
    return res.rows[0] || null;
  }

  async findAll(): Promise<IRole[]> {
    const res = await query<IRole>(
      `SELECT * FROM roles WHERE deleted_at IS NULL ORDER BY name ASC`
    );
    return res.rows;
  }
}
