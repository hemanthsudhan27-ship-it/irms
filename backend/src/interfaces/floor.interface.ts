export interface IFloor {
  id: string;
  complex_id: string;
  floor_number: number;
  floor_label: string;
  total_units: number;
  description: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export interface IFloorResponse {
  id: string;
  complexId: string;
  floorNumber: number;
  floorLabel: string;
  totalUnits: number;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
