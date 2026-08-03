import { ResidentRepository } from '../repositories/resident.repository.js';
import { UnitRepository } from '../repositories/unit.repository.js';
import { ActivityLogService } from './activity-log.service.js';
import { IResidentWithDetails, IResidentResponse, ResidentStatus } from '../interfaces/resident.interface.js';
import { BadRequestError, NotFoundError } from '../errors/app-error.js';

export class ResidentService {
  private residentRepository: ResidentRepository;
  private unitRepository: UnitRepository;
  private activityLogService: ActivityLogService;

  constructor() {
    this.residentRepository = new ResidentRepository();
    this.unitRepository = new UnitRepository();
    this.activityLogService = new ActivityLogService();
  }

  public toResponse(resident: IResidentWithDetails): IResidentResponse {
    return {
      id: resident.id,
      unitId: resident.unit_id,
      unitNumber: resident.unit_number,
      unitDisplayName: resident.unit_display_name,
      floorId: resident.floor_id,
      floorLabel: resident.floor_label,
      complexId: resident.complex_id,
      complexName: resident.complex_name,
      userId: resident.user_id,
      fullName: resident.full_name,
      email: resident.email,
      phone: resident.phone,
      emergencyContactName: resident.emergency_contact_name,
      emergencyContactPhone: resident.emergency_contact_phone,
      moveInDate: resident.move_in_date,
      moveOutDate: resident.move_out_date,
      status: resident.status,
      idProofType: resident.id_proof_type,
      idProofNumber: resident.id_proof_number,
      idProofUrl: resident.id_proof_url,
      notes: resident.notes,
      metadata: resident.metadata || {},
      createdAt: resident.created_at,
      updatedAt: resident.updated_at,
    };
  }

  public async getResidents(filters: {
    complexId?: string;
    floorId?: string;
    unitId?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;

    const { residents, total } = await this.residentRepository.findWithFilters({
      complexId: filters.complexId,
      floorId: filters.floorId,
      unitId: filters.unitId,
      status: filters.status,
      search: filters.search,
      limit,
      offset,
    });

    return {
      residents: residents.map((r) => this.toResponse(r)),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  public async getResidentById(id: string): Promise<IResidentResponse> {
    const resident = await this.residentRepository.findById(id);
    if (!resident) {
      throw new NotFoundError(`Resident with ID '${id}' not found`);
    }
    return this.toResponse(resident);
  }

  public async createResident(
    data: {
      unitId: string;
      fullName: string;
      email?: string;
      phone: string;
      emergencyContactName?: string;
      emergencyContactPhone?: string;
      moveInDate?: string | Date;
      idProofType?: string;
      idProofNumber?: string;
      idProofUrl?: string;
      notes?: string;
      metadata?: Record<string, any>;
    },
    userId: string,
    ipAddress?: string | null,
    userAgent?: string | null
  ): Promise<IResidentResponse> {
    const unit = await this.unitRepository.findById(data.unitId);
    if (!unit) {
      throw new NotFoundError(`Apartment Unit with ID '${data.unitId}' not found`);
    }

    if (unit.occupancy_count >= unit.capacity) {
      throw new BadRequestError(
        `Unit '${unit.display_name}' has reached its maximum capacity of ${unit.capacity} residents.`
      );
    }

    const newResident = await this.residentRepository.create({
      unit_id: data.unitId,
      full_name: data.fullName,
      email: data.email || null,
      phone: data.phone,
      emergency_contact_name: data.emergencyContactName || null,
      emergency_contact_phone: data.emergencyContactPhone || null,
      move_in_date: data.moveInDate ? new Date(data.moveInDate) : new Date(),
      status: 'active',
      id_proof_type: data.idProofType || null,
      id_proof_number: data.idProofNumber || null,
      id_proof_url: data.idProofUrl || null,
      notes: data.notes || null,
      metadata: data.metadata || {},
    });

    const fullResident = await this.residentRepository.findById(newResident.id);

    await this.activityLogService.log({
      companyId: fullResident?.company_id || null,
      complexId: fullResident?.complex_id || null,
      userId,
      action: 'create',
      entityType: 'residents',
      entityId: newResident.id,
      description: `Registered move-in for resident '${newResident.full_name}' into unit '${fullResident?.unit_display_name}'`,
      newValues: this.toResponse(fullResident!),
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
    });

    return this.toResponse(fullResident!);
  }

  public async updateResident(
    id: string,
    data: Partial<{
      fullName: string;
      email: string;
      phone: string;
      emergencyContactName: string;
      emergencyContactPhone: string;
      moveInDate: string | Date;
      moveOutDate: string | Date;
      status: ResidentStatus;
      idProofType: string;
      idProofNumber: string;
      idProofUrl: string;
      notes: string;
      metadata: Record<string, any>;
    }>,
    userId: string,
    ipAddress?: string | null,
    userAgent?: string | null
  ): Promise<IResidentResponse> {
    const existing = await this.residentRepository.findById(id);
    if (!existing) {
      throw new NotFoundError(`Resident with ID '${id}' not found`);
    }

    await this.residentRepository.update(id, {
      full_name: data.fullName,
      email: data.email,
      phone: data.phone,
      emergency_contact_name: data.emergencyContactName,
      emergency_contact_phone: data.emergencyContactPhone,
      move_in_date: data.moveInDate ? new Date(data.moveInDate) : undefined,
      move_out_date: data.moveOutDate ? new Date(data.moveOutDate) : undefined,
      status: data.status,
      id_proof_type: data.idProofType,
      id_proof_number: data.idProofNumber,
      id_proof_url: data.idProofUrl,
      notes: data.notes,
      metadata: data.metadata,
    });

    const updated = await this.residentRepository.findById(id);

    await this.activityLogService.log({
      companyId: existing.company_id,
      complexId: existing.complex_id,
      userId,
      action: 'update',
      entityType: 'residents',
      entityId: id,
      description: `Updated profile for resident '${updated!.full_name}'`,
      oldValues: this.toResponse(existing),
      newValues: this.toResponse(updated!),
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
    });

    return this.toResponse(updated!);
  }

  public async moveOutResident(
    id: string,
    moveOutDate: string | Date,
    userId: string,
    ipAddress?: string | null,
    userAgent?: string | null
  ): Promise<IResidentResponse> {
    const existing = await this.residentRepository.findById(id);
    if (!existing) {
      throw new NotFoundError(`Resident with ID '${id}' not found`);
    }

    if (existing.status === 'moved_out') {
      throw new BadRequestError(`Resident '${existing.full_name}' has already moved out.`);
    }

    const date = moveOutDate ? new Date(moveOutDate) : new Date();

    await this.residentRepository.update(id, {
      status: 'moved_out',
      move_out_date: date,
    });

    const updated = await this.residentRepository.findById(id);

    await this.activityLogService.log({
      companyId: existing.company_id,
      complexId: existing.complex_id,
      userId,
      action: 'update',
      entityType: 'residents',
      entityId: id,
      description: `Processed move-out for resident '${existing.full_name}' from unit '${existing.unit_display_name}'`,
      oldValues: this.toResponse(existing),
      newValues: this.toResponse(updated!),
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
    });

    return this.toResponse(updated!);
  }

  public async deleteResident(
    id: string,
    userId: string,
    ipAddress?: string | null,
    userAgent?: string | null
  ): Promise<void> {
    const existing = await this.residentRepository.findById(id);
    if (!existing) {
      throw new NotFoundError(`Resident with ID '${id}' not found`);
    }

    await this.residentRepository.softDelete(id);

    await this.activityLogService.log({
      companyId: existing.company_id,
      complexId: existing.complex_id,
      userId,
      action: 'delete',
      entityType: 'residents',
      entityId: id,
      description: `Deleted resident record for '${existing.full_name}'`,
      oldValues: this.toResponse(existing),
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
    });
  }
}
