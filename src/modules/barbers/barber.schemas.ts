import { z } from 'zod';

const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

const workingHoursSchema = z
  .object({
    dayOfWeek: z.number().int().min(0).max(6), // 0 = Sunday, 6 = Saturday
    startTime: z.string().regex(timeRegex, 'Invalid time format (HH:mm)'),
    endTime: z.string().regex(timeRegex, 'Invalid time format (HH:mm)'),
    lunchStartTime: z.string().regex(timeRegex, 'Invalid time format (HH:mm)').optional(),
    lunchEndTime: z.string().regex(timeRegex, 'Invalid time format (HH:mm)').optional(),
    isAvailable: z.boolean().default(true),
  })
  .refine(
    (data) => {
      const startMin = timeToMinutes(data.startTime);
      const endMin = timeToMinutes(data.endTime);
      return endMin > startMin;
    },
    { message: 'End time must be after start time', path: ['endTime'] }
  )
  .refine(
    (data) => {
      const hasStart = data.lunchStartTime != null && data.lunchStartTime !== '';
      const hasEnd = data.lunchEndTime != null && data.lunchEndTime !== '';
      if (!hasStart && !hasEnd) return true;
      if (hasStart !== hasEnd) return false;
      const startMin = timeToMinutes(data.startTime);
      const endMin = timeToMinutes(data.endTime);
      const lunchStart = timeToMinutes(data.lunchStartTime!);
      const lunchEnd = timeToMinutes(data.lunchEndTime!);
      return (
        lunchEnd > lunchStart &&
        lunchStart >= startMin &&
        lunchEnd <= endMin
      );
    },
    {
      message:
        'Lunch break: provide both start and end; end must be after start and within working hours',
      path: ['lunchEndTime'],
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

