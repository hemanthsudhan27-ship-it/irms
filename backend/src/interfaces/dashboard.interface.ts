export interface ISuperAdminDashboardStats {
  totalCompanies: number;
  totalComplexes: number;
  totalFloors: number;
  totalUnits: number;
  occupiedUnits: number;
  vacantUnits: number;
  maintenanceUnits: number;
  totalResidents: number;
  totalAdmins: number;
  occupancyRate: number; // Percentage 0 - 100
}

export interface IComplexAdminDashboardStats {
  complexId: string;
  complexName: string;
  totalFloors: number;
  totalUnits: number;
  occupiedUnits: number;
  vacantUnits: number;
  maintenanceUnits: number;
  totalResidents: number;
  occupancyRate: number; // Percentage 0 - 100
}
