export type UserStatus = 'active' | 'inactive' | 'suspended' | 'pending';
export type ComplexStatus = 'active' | 'inactive' | 'under_construction' | 'archived';
export type UnitStatus = 'available' | 'occupied' | 'maintenance' | 'reserved' | 'inactive';
export type ResidentStatus = 'active' | 'inactive' | 'evicted' | 'moved_out';
export type LogAction = 'create' | 'update' | 'delete' | 'login' | 'logout' | 'view' | 'assign' | 'unassign' | 'restore';

export interface IRole {
  id: string;
  name: string;
  slug: 'super_admin' | 'complex_admin' | 'resident';
  permissions: Record<string, any>;
}

export interface IUser {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  status: UserStatus;
  role: IRole;
  companyId: string | null;
  companyName?: string | null;
  complexId: string | null;
  complexName?: string | null;
  residentId: string | null;
  lastLogin: string | null;
  createdAt: string;
}

export interface ICompany {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string;
  postalCode: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  isActive: boolean;
  settings: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface IComplex {
  id: string;
  companyId: string;
  companyName?: string;
  name: string;
  slug: string;
  code: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string;
  postalCode: string | null;
  phone: string | null;
  email: string | null;
  totalFloors: number;
  totalUnits: number;
  status: ComplexStatus;
  amenities: any[];
  settings: Record<string, any>;
  assignedAdmin?: {
    id: string;
    name: string;
    email: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface IFloor {
  id: string;
  complexId: string;
  floorNumber: number;
  floorLabel: string;
  totalUnits: number;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IApartmentUnit {
  id: string;
  floorId: string;
  floorLabel?: string;
  floorNumber?: number;
  complexId?: string;
  complexName?: string;
  companyId?: string;
  companyName?: string;
  unitNumber: string;
  displayName: string;
  capacity: number;
  occupancyCount: number;
  status: UnitStatus;
  unitType: string | null;
  areaSqft: number | null;
  rentAmount: number | null;
  depositAmount: number | null;
  description: string | null;
  amenities: any[];
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface IResident {
  id: string;
  unitId: string;
  unitNumber?: string;
  unitDisplayName?: string;
  floorId?: string;
  floorLabel?: string;
  complexId?: string;
  complexName?: string;
  userId: string | null;
  fullName: string;
  email: string | null;
  phone: string;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  moveInDate: string;
  moveOutDate: string | null;
  status: ResidentStatus;
  idProofType: string | null;
  idProofNumber: string | null;
  idProofUrl: string | null;
  notes: string | null;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface IActivityLog {
  id: string;
  company_id: string | null;
  complex_id: string | null;
  user_id: string | null;
  action: LogAction;
  entity_type: string;
  entity_id: string | null;
  description: string | null;
  old_values: Record<string, any> | null;
  new_values: Record<string, any> | null;
  ip_address: string | null;
  user_agent: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

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
  occupancyRate: number;
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
  occupancyRate: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
