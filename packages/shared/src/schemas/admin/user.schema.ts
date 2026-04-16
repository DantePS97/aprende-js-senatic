import { z } from 'zod';

export const PromoteDemoteSchema = z.object({
  email: z.string().email('Debe ser un email válido'),
});

