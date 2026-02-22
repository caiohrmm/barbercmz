import { z } from 'zod';

export const getCustomersSchema = z.object({
  query: z.object({
    blocked: z.string().optional().transform((val) => val === 'true'),
    search: z.string().optional(), // Search by name or phone
  }).optional(),
});

export const blockCustomerSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid customer ID'),
  }),
  body: z.object({
    blocked: z.boolean(),
  }),
});

export type GetCustomersInput = z.infer<typeof getCustomersSchema>['query'];
export type BlockCustomerInput = z.infer<typeof blockCustomerSchema>['body'];

