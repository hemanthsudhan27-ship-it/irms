import { query } from '../database/index.js';
import { IUser, IUserWithRole } from '../interfaces/user.interface.js';

export class UserRepository {
  async findByEmail(email: string): Promise<IUserWithRole | null> {
    const res = await query<IUserWithRole>(
      `SELECT u.*, 
              r.name AS role_name, 
              r.slug AS role_slug, 
              r.permissions AS role_permissions,
              c.name AS complex_name,
              comp.name AS company_name
       FROM users u
       JOIN roles r ON u.role_id = r.id
       LEFT JOIN complexes c ON u.complex_id = c.id
       LEFT JOIN companies comp ON u.company_id = comp.id
       WHERE LOWER(u.email) = LOWER($1) AND u.deleted_at IS NULL`,
      [email]
    );
    return res.rows[0] || null;
  }

  async findById(id: string): Promise<IUserWithRole | null> {
    const res = await query<IUserWithRole>(
      `SELECT u.*, 
              r.name AS role_name, 
              r.slug AS role_slug, 
              r.permissions AS role_permissions,
              c.name AS complex_name,
              comp.name AS company_name
       FROM users u
       JOIN roles r ON u.role_id = r.id
       LEFT JOIN complexes c ON u.complex_id = c.id
       LEFT JOIN companies comp ON u.company_id = comp.id
       WHERE u.id = $1 AND u.deleted_at IS NULL`,
      [id]
    );
    return res.rows[0] || null;
  }

  async findAllUsers(): Promise<IUserWithRole[]> {
    const res = await query<IUserWithRole>(
      `SELECT u.id, u.full_name, u.email, u.phone, u.status, u.complex_id,
              r.name AS role_name, r.slug AS role_slug
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.deleted_at IS NULL AND u.status = 'active'
       ORDER BY u.full_name ASC`
    );
    return res.rows;
  }

  async updateLastLogin(id: string): Promise<void> {
    await query(
      `UPDATE users SET last_login = NOW(), updated_at = NOW() WHERE id = $1`,
      [id]
    );
  }

  async create(userData: Partial<IUser>): Promise<IUser> {
    const res = await query<IUser>(
      `INSERT INTO users (
        company_id, role_id, complex_id, resident_id, full_name, email, phone, password_hash, avatar_url, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        userData.company_id || null,
        userData.role_id,
        userData.complex_id || null,
        userData.resident_id || null,
        userData.full_name,
        userData.email,
        userData.phone || null,
        userData.password_hash,
        userData.avatar_url || null,
        userData.status || 'active',
      ]
    );
    return res.rows[0];
  }
}
