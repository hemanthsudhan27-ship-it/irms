import { z } from 'zod';

export const createFloorSchema = z.object({
  complexId: z.string().uuid('Invalid complex ID format'),
  floorNumber: z.number().int().min(0, 'Floor number must be 0 or greater'),
  floorLabel: z.string().trim().min(1, 'Floor label is required').max(50),
  description: z.string().optional(),
});

export const updateFloorSchema = z.object({
  floorNumber: z.number().int().min(0).optional(),
  floorLabel: z.string().trim().min(1).max(50).optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

export type CreateFloorDto = z.infer<typeof createFloorSchema>;
export type UpdateFloorDto = z.infer<typeof updateFloorSchema>;
