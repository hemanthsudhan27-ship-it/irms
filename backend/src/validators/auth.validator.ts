import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().trim().min(1, 'Email is required').email('Invalid email address format'),
  password: z.string().min(1, 'Password is required'),
});

export const createUserSchema = z.object({
  fullName: z.string().trim().min(1, 'Full name is required'),
  email: z.string().trim().min(1, 'Email is required').email('Invalid email address format'),
  phone: z.string().trim().optional().nullable(),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  roleSlug: z.enum(['super_admin', 'complex_admin', 'resident']),
  companyId: z.string().uuid().optional().nullable(),
  complexId: z.string().uuid().optional().nullable(),
});

export type LoginDto = z.infer<typeof loginSchema>;
export type CreateUserDto = z.infer<typeof createUserSchema>;
