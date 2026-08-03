export type UnitStatus = 'available' | 'occupied' | 'maintenance' | 'reserved' | 'inactive';

export interface IApartmentUnit {
  id: string;
  floor_id: string;
  unit_number: string;
  capacity: number;
  occupancy_count: number;
  status: UnitStatus;
  unit_type: string | null;
  area_sqft: number | null;
  rent_amount: number | null;
  deposit_amount: number | null;
  description: string | null;
  amenities: any[];
  metadata: Record<string, any>;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export interface IApartmentUnitDisplay extends IApartmentUnit {
  floor_label: string;
  floor_number: number;
  complex_name: string;
  complex_id: string;
  company_name: string;
  company_id: string;
  display_name: string; // e.g. Alpha-A1, Gamma-C3
}

export interface IUnitResponse {
  id: string;
  floorId: string;
  floorLabel?: string;
  floorNumber?: number;
  complexId?: string;
  complexName?: string;
  companyId?: string;
  companyName?: string;
  unitNumber: string;
  displayName: string; // e.g. Alpha-A1
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
  createdAt: Date;
  updatedAt: Date;
}
