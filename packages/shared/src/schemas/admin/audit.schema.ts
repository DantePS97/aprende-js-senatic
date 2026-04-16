import { z } from 'zod';

export const AuditQuerySchema = z.object({
  limit: z.coerce
    .number()
    .int('limit debe ser un entero')
    .min(1, 'limit mínimo es 1')
    .max(100, 'limit máximo es 100')
    .default(50),
  offset: z.coerce
    .number()
    .int('offset debe ser un entero')
    .min(0, 'offset no puede ser negativo')
    .default(0),
});

