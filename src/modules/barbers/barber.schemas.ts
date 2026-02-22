import { z } from 'zod';

const workingHoursSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6), // 0 = Sunday, 6 = Saturday
  startTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:mm)'),
  endTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:mm)'),
  isAvailable: z.boolean().default(true),
}).refine(
  (data) => {
    // Validate that endTime is after startTime
    const [startHour, startMin] = data.startTime.split(':').map(Number);
    const [endHour, endMin] = data.endTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    return endMinutes > startMinutes;
  },
  {
    message: 'End time must be after start time',
    path: ['endTime'],
  }
);

export const createBarberSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name must be at most 100 characters'),
    workingHours: z.array(workingHoursSchema).optional().default([]),
  }),
});

export const getBarbersSchema = z.object({
  query: z.object({
    active: z.string().optional().transform((val) => val === 'true'),
  }).optional(),
});

export const updateBarberSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid barber ID'),
  }),
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name must be at most 100 characters').optional(),
    workingHours: z.array(workingHoursSchema).optional(),
    active: z.boolean().optional(),
  }),
});

export const deleteBarberSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid barber ID'),
  }),
});

export type CreateBarberInput = z.infer<typeof createBarberSchema>['body'];
export type GetBarbersInput = z.infer<typeof getBarbersSchema>['query'];
export type UpdateBarberInput = z.infer<typeof updateBarberSchema>['body'];
export type DeleteBarberInput = z.infer<typeof deleteBarberSchema>['params'];

