import { query } from '../database/index.js';
import { ISuperAdminDashboardStats, IComplexAdminDashboardStats } from '../interfaces/dashboard.interface.js';

export class DashboardRepository {
  async getSuperAdminStats(): Promise<ISuperAdminDashboardStats> {
    const res = await query(`
      SELECT 
        (SELECT COUNT(*) FROM companies WHERE deleted_at IS NULL) AS total_companies,
        (SELECT COUNT(*) FROM complexes WHERE deleted_at IS NULL) AS total_complexes,
        (SELECT COUNT(*) FROM floors WHERE deleted_at IS NULL) AS total_floors,
        (SELECT COUNT(*) FROM apartment_units WHERE deleted_at IS NULL) AS total_units,
        (SELECT COUNT(*) FROM apartment_units WHERE status = 'occupied' AND deleted_at IS NULL) AS occupied_units,
        (SELECT COUNT(*) FROM apartment_units WHERE status = 'available' AND deleted_at IS NULL) AS vacant_units,
        (SELECT COUNT(*) FROM apartment_units WHERE status = 'maintenance' AND deleted_at IS NULL) AS maintenance_units,
        (SELECT COUNT(*) FROM residents WHERE status = 'active' AND deleted_at IS NULL) AS total_residents,
        (SELECT COUNT(*) FROM users WHERE status = 'active' AND deleted_at IS NULL) AS total_admins
    `);

    const row = res.rows[0];
    const totalUnits = parseInt(row.total_units || '0', 10);
    const occupiedUnits = parseInt(row.occupied_units || '0', 10);
    const occupancyRate = totalUnits > 0 ? parseFloat(((occupiedUnits / totalUnits) * 100).toFixed(1)) : 0;

    return {
      totalCompanies: parseInt(row.total_companies || '0', 10),
      totalComplexes: parseInt(row.total_complexes || '0', 10),
      totalFloors: parseInt(row.total_floors || '0', 10),
      totalUnits,
      occupiedUnits,
      vacantUnits: parseInt(row.vacant_units || '0', 10),
      maintenanceUnits: parseInt(row.maintenance_units || '0', 10),
      totalResidents: parseInt(row.total_residents || '0', 10),
      totalAdmins: parseInt(row.total_admins || '0', 10),
      occupancyRate,
    };
  }

  async getComplexAdminStats(complexId: string): Promise<IComplexAdminDashboardStats | null> {
    const complexRes = await query(
      `SELECT name FROM complexes WHERE id = $1 AND deleted_at IS NULL`,
      [complexId]
    );

    if (complexRes.rows.length === 0) return null;
    const complexName = complexRes.rows[0].name;

    const res = await query(`
      SELECT 
        (SELECT COUNT(*) FROM floors WHERE complex_id = $1 AND deleted_at IS NULL) AS total_floors,
        (SELECT COUNT(*) FROM apartment_units au JOIN floors f ON au.floor_id = f.id WHERE f.complex_id = $1 AND au.deleted_at IS NULL) AS total_units,
        (SELECT COUNT(*) FROM apartment_units au JOIN floors f ON au.floor_id = f.id WHERE f.complex_id = $1 AND au.status = 'occupied' AND au.deleted_at IS NULL) AS occupied_units,
        (SELECT COUNT(*) FROM apartment_units au JOIN floors f ON au.floor_id = f.id WHERE f.complex_id = $1 AND au.status = 'available' AND au.deleted_at IS NULL) AS vacant_units,
        (SELECT COUNT(*) FROM apartment_units au JOIN floors f ON au.floor_id = f.id WHERE f.complex_id = $1 AND au.status = 'maintenance' AND au.deleted_at IS NULL) AS maintenance_units,
        (SELECT COUNT(*) FROM residents r JOIN apartment_units au ON r.unit_id = au.id JOIN floors f ON au.floor_id = f.id WHERE f.complex_id = $1 AND r.status = 'active' AND r.deleted_at IS NULL) AS total_residents
    `, [complexId]);

    const row = res.rows[0];
    const totalUnits = parseInt(row.total_units || '0', 10);
    const occupiedUnits = parseInt(row.occupied_units || '0', 10);
    const occupancyRate = totalUnits > 0 ? parseFloat(((occupiedUnits / totalUnits) * 100).toFixed(1)) : 0;

    return {
      complexId,
      complexName,
      totalFloors: parseInt(row.total_floors || '0', 10),
      totalUnits,
      occupiedUnits,
      vacantUnits: parseInt(row.vacant_units || '0', 10),
      maintenanceUnits: parseInt(row.maintenance_units || '0', 10),
      totalResidents: parseInt(row.total_residents || '0', 10),
      occupancyRate,
    };
  }
}
