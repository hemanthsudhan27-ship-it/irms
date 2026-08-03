import { FloorRepository } from '../repositories/floor.repository.js';
import { ComplexRepository } from '../repositories/complex.repository.js';
import { ActivityLogService } from './activity-log.service.js';
import { IFloor, IFloorResponse } from '../interfaces/floor.interface.js';
import { ConflictError, NotFoundError } from '../errors/app-error.js';

export class FloorService {
  private floorRepository: FloorRepository;
  private complexRepository: ComplexRepository;
  private activityLogService: ActivityLogService;

  constructor() {
    this.floorRepository = new FloorRepository();
    this.complexRepository = new ComplexRepository();
    this.activityLogService = new ActivityLogService();
  }

  public toResponse(floor: IFloor): IFloorResponse {
    return {
      id: floor.id,
      complexId: floor.complex_id,
      floorNumber: floor.floor_number,
      floorLabel: floor.floor_label,
      totalUnits: floor.total_units,
      description: floor.description,
      isActive: floor.is_active,
      createdAt: floor.created_at,
      updatedAt: floor.updated_at,
    };
  }

  public async getFloorsByComplex(complexId: string): Promise<IFloorResponse[]> {
    const complex = await this.complexRepository.findById(complexId);
    if (!complex) {
      throw new NotFoundError(`Apartment Complex with ID '${complexId}' not found`);
    }

    const floors = await this.floorRepository.findByComplexId(complexId);
    return floors.map((f) => this.toResponse(f));
  }

  public async getFloorById(id: string): Promise<IFloorResponse> {
    const floor = await this.floorRepository.findById(id);
    if (!floor) {
      throw new NotFoundError(`Floor with ID '${id}' not found`);
    }
    return this.toResponse(floor);
  }

  public async createFloor(
    data: {
      complexId: string;
      floorNumber: number;
      floorLabel: string;
      description?: string;
    },
    userId: string,
    ipAddress?: string | null,
    userAgent?: string | null
  ): Promise<IFloorResponse> {
    const complex = await this.complexRepository.findById(data.complexId);
    if (!complex) {
      throw new NotFoundError(`Apartment Complex with ID '${data.complexId}' not found`);
    }

    const numCheck = await this.floorRepository.findByFloorNumber(data.complexId, data.floorNumber);
    if (numCheck) {
      throw new ConflictError(`Floor number ${data.floorNumber} already exists in this complex`);
    }

    const labelCheck = await this.floorRepository.findByFloorLabel(data.complexId, data.floorLabel);
    if (labelCheck) {
      throw new ConflictError(`Floor label '${data.floorLabel}' already exists in this complex`);
    }

    const newFloor = await this.floorRepository.create({
      complex_id: data.complexId,
      floor_number: data.floorNumber,
      floor_label: data.floorLabel,
      description: data.description || null,
      is_active: true,
    });

    await this.activityLogService.log({
      companyId: complex.company_id,
      complexId: data.complexId,
      userId,
      action: 'create',
      entityType: 'floors',
      entityId: newFloor.id,
      description: `Created floor '${newFloor.floor_label}' (Floor ${newFloor.floor_number}) in '${complex.name}'`,
      newValues: this.toResponse(newFloor),
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
    });

    return this.toResponse(newFloor);
  }

  public async updateFloor(
    id: string,
    data: Partial<{
      floorNumber: number;
      floorLabel: string;
      description: string;
      isActive: boolean;
    }>,
    userId: string,
    ipAddress?: string | null,
    userAgent?: string | null
  ): Promise<IFloorResponse> {
    const existing = await this.floorRepository.findById(id);
    if (!existing) {
      throw new NotFoundError(`Floor with ID '${id}' not found`);
    }

    if (data.floorNumber !== undefined && data.floorNumber !== existing.floor_number) {
      const numCheck = await this.floorRepository.findByFloorNumber(existing.complex_id, data.floorNumber);
      if (numCheck && numCheck.id !== id) {
        throw new ConflictError(`Floor number ${data.floorNumber} already exists in this complex`);
      }
    }

    if (data.floorLabel !== undefined && data.floorLabel !== existing.floor_label) {
      const labelCheck = await this.floorRepository.findByFloorLabel(existing.complex_id, data.floorLabel);
      if (labelCheck && labelCheck.id !== id) {
        throw new ConflictError(`Floor label '${data.floorLabel}' already exists in this complex`);
      }
    }

    const updated = await this.floorRepository.update(id, {
      floor_number: data.floorNumber,
      floor_label: data.floorLabel,
      description: data.description,
      is_active: data.isActive,
    });

    if (!updated) {
      throw new NotFoundError('Floor update failed');
    }

    const complex = await this.complexRepository.findById(existing.complex_id);

    await this.activityLogService.log({
      companyId: complex?.company_id || null,
      complexId: existing.complex_id,
      userId,
      action: 'update',
      entityType: 'floors',
      entityId: id,
      description: `Updated floor details for '${updated.floor_label}'`,
      oldValues: this.toResponse(existing),
      newValues: this.toResponse(updated),
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
    });

    return this.toResponse(updated);
  }

  public async deleteFloor(
    id: string,
    userId: string,
    ipAddress?: string | null,
    userAgent?: string | null
  ): Promise<void> {
    const existing = await this.floorRepository.findById(id);
    if (!existing) {
      throw new NotFoundError(`Floor with ID '${id}' not found`);
    }

    await this.floorRepository.softDelete(id, existing.complex_id);
    const complex = await this.complexRepository.findById(existing.complex_id);

    await this.activityLogService.log({
      companyId: complex?.company_id || null,
      complexId: existing.complex_id,
      userId,
      action: 'delete',
      entityType: 'floors',
      entityId: id,
      description: `Deleted floor '${existing.floor_label}'`,
      oldValues: this.toResponse(existing),
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
    });
  }
}
