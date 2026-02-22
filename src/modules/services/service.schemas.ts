import { z } from 'zod';

export const createServiceSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name must be at most 100 characters'),
    duration: z.number().int().positive('Duration must be a positive number').min(1, 'Duration must be at least 1 minute'),
    price: z.number().nonnegative('Price must be non-negative').min(0, 'Price must be at least 0'),
  }),
});

export const getServicesSchema = z.object({
  query: z.object({
    active: z.string().optional().transform((val) => val === 'true'),
  }).optional(),
});

export const updateServiceSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid service ID'),
  }),
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name must be at most 100 characters').optional(),
    duration: z.number().int().positive('Duration must be a positive number').min(1, 'Duration must be at least 1 minute').optional(),
    price: z.number().nonnegative('Price must be non-negative').min(0, 'Price must be at least 0').optional(),
    active: z.boolean().optional(),
  }),
});

export const deleteServiceSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid service ID'),
  }),
});

export type CreateServiceInput = z.infer<typeof createServiceSchema>['body'];
export type GetServicesInput = z.infer<typeof getServicesSchema>['query'];
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>['body'];
export type DeleteServiceInput = z.infer<typeof deleteServiceSchema>['params'];

