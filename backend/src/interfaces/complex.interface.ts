export type ComplexStatus = 'active' | 'inactive' | 'under_construction' | 'archived';

export interface IComplex {
  id: string;
  company_id: string;
  name: string;
  slug: string;
  code: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string;
  postal_code: string | null;
  phone: string | null;
  email: string | null;
  total_floors: number;
  total_units: number;
  status: ComplexStatus;
  amenities: any[];
  settings: Record<string, any>;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export interface IComplexWithDetails extends IComplex {
  company_name: string;
  assigned_admin_id?: string | null;
  assigned_admin_name?: string | null;
  assigned_admin_email?: string | null;
}

export interface IComplexResponse {
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
  createdAt: Date;
  updatedAt: Date;
}
