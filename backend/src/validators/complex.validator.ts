import { z } from 'zod';

export const createComplexSchema = z.object({
  companyId: z.string().uuid('Invalid company ID format'),
  name: z.string().trim().min(2, 'Complex name must be at least 2 characters').max(255),
  code: z.string().max(50).optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().default('India'),
  postalCode: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email address format').optional().or(z.literal('')),
  amenities: z.array(z.any()).optional(),
  settings: z.record(z.any()).optional(),
});

export const updateComplexSchema = createComplexSchema.partial();

export const renameComplexSchema = z.object({
  name: z.string().trim().min(2, 'Complex name must be at least 2 characters').max(255),
});

export const assignAdminSchema = z.object({
  adminUserId: z.string().uuid('Invalid user ID format'),
});

export type CreateComplexDto = z.infer<typeof createComplexSchema>;
export type UpdateComplexDto = z.infer<typeof updateComplexSchema>;
export type RenameComplexDto = z.infer<typeof renameComplexSchema>;
export type AssignAdminDto = z.infer<typeof assignAdminSchema>;
