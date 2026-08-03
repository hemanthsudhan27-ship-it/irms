import { z } from 'zod';

export const createUnitSchema = z.object({
  floorId: z.string().uuid('Invalid floor ID format'),
  unitNumber: z.string().trim().min(1, 'Unit number is required').max(50),
  capacity: z.number().int().min(1, 'Capacity must be at least 1').default(1),
  unitType: z.string().optional(),
  areaSqft: z.number().positive().optional(),
  rentAmount: z.number().nonnegative().optional(),
  depositAmount: z.number().nonnegative().optional(),
  description: z.string().optional(),
  amenities: z.array(z.any()).optional(),
  metadata: z.record(z.any()).optional(),
});

export const updateUnitSchema = createUnitSchema.partial().extend({
  status: z.enum(['available', 'occupied', 'maintenance', 'reserved', 'inactive']).optional(),
});

export type CreateUnitDto = z.infer<typeof createUnitSchema>;
export type UpdateUnitDto = z.infer<typeof updateUnitSchema>;
