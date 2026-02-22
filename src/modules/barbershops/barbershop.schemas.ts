import { z } from 'zod';

// Helper function to generate slug from name
const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphen
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
};

export const createBarbershopSchema = z.object({
  body: z.object({
    name: z.string().min(3, 'Name must be at least 3 characters').max(100, 'Name must be at most 100 characters'),
    slug: z
      .string()
      .min(3, 'Slug must be at least 3 characters')
      .max(50, 'Slug must be at most 50 characters')
      .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers and hyphens')
      .optional(),
    planId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid plan ID').optional(),
    // Owner data
    ownerName: z.string().min(3, 'Owner name must be at least 3 characters').max(100),
    ownerEmail: z.string().email('Invalid email format'),
    ownerPassword: z.string().min(6, 'Password must be at least 6 characters'),
  }),
});

export const getBarbershopSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid barbershop ID'),
  }),
});

export type CreateBarbershopInput = z.infer<typeof createBarbershopSchema>['body'];
export type GetBarbershopInput = z.infer<typeof getBarbershopSchema>['params'];

// Export slug generator for use in service
export { generateSlug };

