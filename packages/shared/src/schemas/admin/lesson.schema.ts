import { z } from 'zod';

export const LessonCreateSchema = z.object({
  moduleId: z.string().min(1, 'moduleId es requerido'), // ObjectId as string
  title: z
    .string()
    .min(3, 'El título debe tener al menos 3 caracteres')
    .max(100, 'El título no puede superar 100 caracteres'),
  xpReward: z
    .number()
    .int('xpReward debe ser un entero')
    .min(10, 'xpReward mínimo es 10')
    .max(1000, 'xpReward máximo es 1000'),
  isPublished: z.boolean().default(false),
});

// moduleId is scoped to creation — omitted from update schema (REQ-056)
export const LessonUpdateSchema = LessonCreateSchema.omit({ moduleId: true })
  .partial()
  .extend({
    updatedAt: z.string().datetime('updatedAt debe ser una fecha ISO válida'), // optimistic locking
  });

