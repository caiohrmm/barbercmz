import { z } from 'zod';

export const createAppointmentSchema = z.object({
  body: z.object({
    barbershopId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid barbershop ID'),
    barberId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid barber ID'),
    serviceId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid service ID'),
    customerName: z.string().min(2, 'Name must be at least 2 characters').max(100),
    customerPhone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone format (E.164)'),
    startTime: z.string().datetime('Invalid date format'),
  }),
});

export const getAppointmentsSchema = z.object({
  query: z.object({
    status: z.enum(['scheduled', 'completed', 'cancelled', 'no_show']).optional(),
    barberId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid barber ID').optional(),
    customerId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid customer ID').optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  }).optional(),
});

export const updateAppointmentStatusSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid appointment ID'),
  }),
  body: z.object({
    status: z.enum(['scheduled', 'completed', 'cancelled', 'no_show']),
  }),
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>['body'];
export type GetAppointmentsInput = z.infer<typeof getAppointmentsSchema>['query'];
export type UpdateAppointmentStatusInput = z.infer<typeof updateAppointmentStatusSchema>['body'];

