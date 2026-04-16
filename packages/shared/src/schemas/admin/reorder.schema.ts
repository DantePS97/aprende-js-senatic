import { z } from 'zod';

export const ReorderSchema = z.object({
  direction: z.enum(['up', 'down'], {
    errorMap: () => ({ message: "direction debe ser 'up' o 'down'" }),
  }),
});

