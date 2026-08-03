import { z } from 'zod';

export const createResidentSchema = z.object({
  unitId: z.string().uuid('Invalid unit ID format'),
  fullName: z.string().trim().min(2, 'Full name must be at least 2 characters').max(255),
  email: z.string().email('Invalid email address format').optional().or(z.literal('')),
  phone: z.string().trim().min(5, 'Phone number is required').max(30),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  moveInDate: z.string().optional(),
  idProofType: z.string().optional(),
  idProofNumber: z.string().optional(),
  idProofUrl: z.string().url('Invalid URL format').optional().or(z.literal('')),
  notes: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

export const updateResidentSchema = createResidentSchema.partial().extend({
  status: z.enum(['active', 'inactive', 'evicted', 'moved_out']).optional(),
  moveOutDate: z.string().optional(),
});

export const moveOutResidentSchema = z.object({
  moveOutDate: z.string().optional(),
});

export type CreateResidentDto = z.infer<typeof createResidentSchema>;
export type UpdateResidentDto = z.infer<typeof updateResidentSchema>;
export type MoveOutResidentDto = z.infer<typeof moveOutResidentSchema>;
