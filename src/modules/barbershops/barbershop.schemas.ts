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

export const getBarbershopBySlugSchema = z.object({
  params: z.object({
    slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Invalid slug format'),
  }),
});

export const getBarbershopServicesSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid barbershop ID'),
  }),
});

export const getPublicBarbersSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid barbershop ID'),
  }),
});

export const getAvailableSlotsSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid barbershop ID'),
  }),
  query: z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
    serviceId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid service ID'),
    barberId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid barber ID').optional(),
  }),
});

const slugSchema = z
  .string()
  .min(3, 'Slug must be at least 3 characters')
  .max(50, 'Slug must be at most 50 characters')
  .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers and hyphens');

export const updateBarbershopSchema = z
  .object({
    body: z
      .object({
        name: z
          .string()
          .min(3, 'Name must be at least 3 characters')
          .max(100, 'Name must be at most 100 characters')
          .optional(),
        slug: slugSchema.optional(),
      })
      .refine((data) => data.name !== undefined || data.slug !== undefined, {
        message: 'At least one of name or slug is required',
      }),
    params: z.object({
      id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid barbershop ID'),
    }),
  });

export type UpdateBarbershopInput = z.infer<typeof updateBarbershopSchema>['body'];

export type CreateBarbershopInput = z.infer<typeof createBarbershopSchema>['body'];
export type GetBarbershopInput = z.infer<typeof getBarbershopSchema>['params'];

// Export slug generator for use in service
export { generateSlug };

