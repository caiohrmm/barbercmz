import { z } from 'zod';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const updatePlanSchema = z.object({
  body: z.object({
    planId: z.string().regex(objectIdRegex, 'Invalid plan ID'),
  }),
  query: z.object({}).strict().optional(),
  params: z.object({}).strict().optional(),
});

export type UpdatePlanBody = z.infer<typeof updatePlanSchema>['body'];
