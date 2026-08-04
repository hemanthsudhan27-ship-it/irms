import bcrypt from 'bcryptjs';
import { query } from './index.js';
import { logger } from '../utils/logger.js';

export async function seedDatabase() {
  try {
    logger.info('Checking and seeding default system admin users...');

    // 1. Fetch Super Admin Role ID
    const superRoleRes = await query<{ id: string }>(
      `SELECT id FROM roles WHERE slug = 'super_admin'`
    );
    if (superRoleRes.rows.length === 0) {
      logger.error('Super Admin role not found. Ensure SQL schema is executed on database.');
      return;
    }
    const superRoleId = superRoleRes.rows[0].id;

    // 2. Fetch Complex Admin Role ID
    const complexRoleRes = await query<{ id: string }>(
      `SELECT id FROM roles WHERE slug = 'complex_admin'`
    );
    const complexRoleId = complexRoleRes.rows[0]?.id || superRoleId;

    // 3. Check if users already exist before hashing passwords (performance optimization)
    const existingSuperAdmin = await query<{ id: string }>(
      `SELECT id FROM users WHERE LOWER(email) = LOWER('superadmin@irms.com') AND deleted_at IS NULL`
    );
    const existingComplexAdmin = await query<{ id: string }>(
      `SELECT id FROM users WHERE LOWER(email) = LOWER('complexadmin@irms.com') AND deleted_at IS NULL`
    );

    // 4. Seed Super Admin User (only if not exists)
    if (existingSuperAdmin.rows.length === 0) {
      const superHash = await bcrypt.hash('SuperAdmin@123#', 10);
      await query(
        `INSERT INTO users (full_name, email, password_hash, role_id, status)
         VALUES ($1, $2, $3, $4, 'active')
         ON CONFLICT (email) DO NOTHING`,
        ['Super Admin', 'superadmin@irms.com', superHash, superRoleId]
      );
      logger.info("Successfully seeded Super Admin user: 'superadmin@irms.com' / 'SuperAdmin@123#'");
    } else {
      logger.info("Super Admin user already exists. Skipping seed.");
    }

    // 5. Seed Complex Admin User (only if not exists)
    if (existingComplexAdmin.rows.length === 0) {
      const complexHash = await bcrypt.hash('ComplexAdmin@123#', 10);
      await query(
        `INSERT INTO users (full_name, email, password_hash, role_id, status)
         VALUES ($1, $2, $3, $4, 'active')
         ON CONFLICT (email) DO NOTHING`,
        ['Complex Admin', 'complexadmin@irms.com', complexHash, complexRoleId]
      );
      logger.info("Successfully seeded Complex Admin user: 'complexadmin@irms.com' / 'ComplexAdmin@123#'");
    } else {
      logger.info("Complex Admin user already exists. Skipping seed.");
    }

  } catch (err: any) {
    logger.error('Error during database seed:', err.message);
  }
}
