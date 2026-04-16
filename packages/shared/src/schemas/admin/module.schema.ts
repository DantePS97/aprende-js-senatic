import { z } from 'zod';

export const ModuleCreateSchema = z.object({
  courseId: z.string().min(1, 'courseId es requerido'), // ObjectId as string
  title: z
    .string()
    .min(3, 'El título debe tener al menos 3 caracteres')
    .max(100, 'El título no puede superar 100 caracteres'),
  description: z
    .string()
    .min(0)
    .max(500, 'La descripción no puede superar 500 caracteres')
    .default(''),
  order: z
    .number()
    .int('El orden debe ser un entero')
    .min(0, 'El orden no puede ser negativo')
    .default(0),
  isPublished: z.boolean().default(false),
});

// courseId is scoped to creation — omitted from update schema
export const ModuleUpdateSchema = ModuleCreateSchema.omit({ courseId: true })
  .partial()
  .extend({
    updatedAt: z.string().datetime('updatedAt debe ser una fecha ISO válida'), // optimistic locking
  });

