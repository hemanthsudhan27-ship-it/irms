import { DashboardRepository } from '../repositories/dashboard.repository.js';
import { ISuperAdminDashboardStats, IComplexAdminDashboardStats } from '../interfaces/dashboard.interface.js';
import { NotFoundError } from '../errors/app-error.js';

export class DashboardService {
  private dashboardRepository: DashboardRepository;

  constructor() {
    this.dashboardRepository = new DashboardRepository();
  }

  public async getSuperAdminDashboard(): Promise<ISuperAdminDashboardStats> {
    return await this.dashboardRepository.getSuperAdminStats();
  }

  public async getComplexAdminDashboard(complexId: string): Promise<IComplexAdminDashboardStats> {
    const stats = await this.dashboardRepository.getComplexAdminStats(complexId);
    if (!stats) {
      throw new NotFoundError(`Apartment Complex with ID '${complexId}' not found`);
    }
    return stats;
  }
}
