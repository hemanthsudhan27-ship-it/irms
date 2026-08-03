import { UnitRepository } from '../repositories/unit.repository.js';
import { FloorRepository } from '../repositories/floor.repository.js';
import { ComplexRepository } from '../repositories/complex.repository.js';
import { ActivityLogService } from './activity-log.service.js';
import { IApartmentUnitDisplay, IUnitResponse, UnitStatus } from '../interfaces/unit.interface.js';
import { ConflictError, NotFoundError, BadRequestError } from '../errors/app-error.js';

export class UnitService {
  private unitRepository: UnitRepository;
  private floorRepository: FloorRepository;
  private complexRepository: ComplexRepository;
  private activityLogService: ActivityLogService;

  constructor() {
    this.unitRepository = new UnitRepository();
    this.floorRepository = new FloorRepository();
    this.complexRepository = new ComplexRepository();
    this.activityLogService = new ActivityLogService();
  }

  public toResponse(unit: IApartmentUnitDisplay): IUnitResponse {
    return {
      id: unit.id,
      floorId: unit.floor_id,
      floorLabel: unit.floor_label,
      floorNumber: unit.floor_number,
      complexId: unit.complex_id,
      complexName: unit.complex_name,
      companyId: unit.company_id,
      companyName: unit.company_name,
      unitNumber: unit.unit_number,
      // Dynamic computed display name: e.g. Alpha-A1, Gamma-C3
      displayName: unit.display_name || `${unit.complex_name || 'Complex'}-${unit.floor_label || ''}${unit.unit_number}`,
      capacity: unit.capacity,
      occupancyCount: unit.occupancy_count,
      status: unit.status,
      unitType: unit.unit_type,
      areaSqft: unit.area_sqft,
      rentAmount: unit.rent_amount,
      depositAmount: unit.deposit_amount,
      description: unit.description,
      amenities: unit.amenities || [],
      metadata: unit.metadata || {},
      createdAt: unit.created_at,
      updatedAt: unit.updated_at,
    };
  }

  public async getUnitsByFloor(floorId: string): Promise<IUnitResponse[]> {
    const floor = await this.floorRepository.findById(floorId);
    if (!floor) {
      throw new NotFoundError(`Floor with ID '${floorId}' not found`);
    }

    const units = await this.unitRepository.findByFloorId(floorId);
    return units.map((u) => this.toResponse(u));
  }

  public async getUnitsByComplex(complexId: string): Promise<IUnitResponse[]> {
    const complex = await this.complexRepository.findById(complexId);
    if (!complex) {
      throw new NotFoundError(`Apartment Complex with ID '${complexId}' not found`);
    }

    const units = await this.unitRepository.findByComplexId(complexId);
    return units.map((u) => this.toResponse(u));
  }

  public async getUnitById(id: string): Promise<IUnitResponse> {
    const unit = await this.unitRepository.findById(id);
    if (!unit) {
      throw new NotFoundError(`Apartment Unit with ID '${id}' not found`);
    }
    return this.toResponse(unit);
  }

  public async createUnit(
    data: {
      floorId: string;
      unitNumber: string;
      capacity?: number;
      unitType?: string;
      areaSqft?: number;
      rentAmount?: number;
      depositAmount?: number;
      description?: string;
      amenities?: any[];
      metadata?: Record<string, any>;
    },
    userId: string,
    ipAddress?: string | null,
    userAgent?: string | null
  ): Promise<IUnitResponse> {
    const floor = await this.floorRepository.findById(data.floorId);
    if (!floor) {
      throw new NotFoundError(`Floor with ID '${data.floorId}' not found`);
    }

    const existingUnit = await this.unitRepository.findByUnitNumber(data.floorId, data.unitNumber);
    if (existingUnit) {
      throw new ConflictError(`Unit number '${data.unitNumber}' already exists on this floor`);
    }

    const newUnit = await this.unitRepository.create({
      floor_id: data.floorId,
      unit_number: data.unitNumber,
      capacity: data.capacity || 1,
      status: 'available',
      unit_type: data.unitType || null,
      area_sqft: data.areaSqft || null,
      rent_amount: data.rentAmount || null,
      deposit_amount: data.depositAmount || null,
      description: data.description || null,
      amenities: data.amenities || [],
      metadata: data.metadata || {},
    });

    const fullUnit = await this.unitRepository.findById(newUnit.id);

    await this.activityLogService.log({
      companyId: fullUnit?.company_id || null,
      complexId: fullUnit?.complex_id || null,
      userId,
      action: 'create',
      entityType: 'apartment_units',
      entityId: newUnit.id,
      description: `Created unit '${fullUnit?.display_name}'`,
      newValues: this.toResponse(fullUnit!),
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
    });

    return this.toResponse(fullUnit!);
  }

  public async updateUnit(
    id: string,
    data: Partial<{
      unitNumber: string;
      capacity: number;
      unitType: string;
      areaSqft: number;
      rentAmount: number;
      depositAmount: number;
      description: string;
      status: UnitStatus;
      amenities: any[];
      metadata: Record<string, any>;
    }>,
    userId: string,
    ipAddress?: string | null,
    userAgent?: string | null
  ): Promise<IUnitResponse> {
    const existing = await this.unitRepository.findById(id);
    if (!existing) {
      throw new NotFoundError(`Apartment Unit with ID '${id}' not found`);
    }

    if (data.unitNumber !== undefined && data.unitNumber !== existing.unit_number) {
      const checkUnit = await this.unitRepository.findByUnitNumber(existing.floor_id, data.unitNumber);
      if (checkUnit && checkUnit.id !== id) {
        throw new ConflictError(`Unit number '${data.unitNumber}' already exists on this floor`);
      }
    }

    if (data.capacity !== undefined && data.capacity < existing.occupancy_count) {
      throw new BadRequestError(`Cannot decrease capacity below current occupancy count (${existing.occupancy_count})`);
    }

    await this.unitRepository.update(id, {
      unit_number: data.unitNumber,
      capacity: data.capacity,
      status: data.status,
      unit_type: data.unitType,
      area_sqft: data.areaSqft,
      rent_amount: data.rentAmount,
      deposit_amount: data.depositAmount,
      description: data.description,
      amenities: data.amenities,
      metadata: data.metadata,
    });

    const updated = await this.unitRepository.findById(id);

    await this.activityLogService.log({
      companyId: existing.company_id,
      complexId: existing.complex_id,
      userId,
      action: 'update',
      entityType: 'apartment_units',
      entityId: id,
      description: `Updated unit '${updated!.display_name}'`,
      oldValues: this.toResponse(existing),
      newValues: this.toResponse(updated!),
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
    });

    return this.toResponse(updated!);
  }

  public async deleteUnit(
    id: string,
    userId: string,
    ipAddress?: string | null,
    userAgent?: string | null
  ): Promise<void> {
    const existing = await this.unitRepository.findById(id);
    if (!existing) {
      throw new NotFoundError(`Apartment Unit with ID '${id}' not found`);
    }

    if (existing.occupancy_count > 0) {
      throw new BadRequestError(`Cannot delete occupied unit '${existing.display_name}'. Move residents out first.`);
    }

    await this.unitRepository.softDelete(id, existing.floor_id);

    await this.activityLogService.log({
      companyId: existing.company_id,
      complexId: existing.complex_id,
      userId,
      action: 'delete',
      entityType: 'apartment_units',
      entityId: id,
      description: `Deleted unit '${existing.display_name}'`,
      oldValues: this.toResponse(existing),
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
    });
  }
}
