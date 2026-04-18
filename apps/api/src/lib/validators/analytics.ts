import { z } from 'zod';

export const dateRangeSchema = z
  .object({
    from: z.string().optional(),
    to: z.string().optional(),
    courseId: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.from && data.to) {
        const diff =
          (new Date(data.to).getTime() - new Date(data.from).getTime()) / 86400000;
        return diff >= 0 && diff <= 365;
      }
      return true;
    },
    { message: 'Date range must be between 0 and 365 days, and from must be before to' },
  );

export type DateRangeQuery = z.infer<typeof dateRangeSchema>;
