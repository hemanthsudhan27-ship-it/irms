export type ResidentStatus = 'active' | 'inactive' | 'evicted' | 'moved_out';

export interface IResident {
  id: string;
  unit_id: string;
  user_id: string | null;
  full_name: string;
  email: string | null;
  phone: string;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  move_in_date: Date;
  move_out_date: Date | null;
  status: ResidentStatus;
  id_proof_type: string | null;
  id_proof_number: string | null;
  id_proof_url: string | null;
  notes: string | null;
  metadata: Record<string, any>;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export interface IResidentWithDetails extends IResident {
  unit_number: string;
  unit_display_name: string;
  capacity: number;
  occupancy_count: number;
  floor_id: string;
  floor_label: string;
  floor_number: number;
  complex_id: string;
  complex_name: string;
  company_id: string;
}

export interface IResidentResponse {
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
  moveInDate: Date;
  moveOutDate: Date | null;
  status: ResidentStatus;
  idProofType: string | null;
  idProofNumber: string | null;
  idProofUrl: string | null;
  notes: string | null;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}
