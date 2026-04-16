import { z } from 'zod';

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const CourseCreateSchema = z.object({
  title: z
    .string()
    .min(3, 'El título debe tener al menos 3 caracteres')
    .max(100, 'El título no puede superar 100 caracteres'),
  slug: z
    .string()
    .regex(SLUG_REGEX, 'El slug debe ser kebab-case (ej: mi-curso-js)')
    .optional(), // auto-derived from title if omitted
  description: z
    .string()
    .min(0)
    .max(500, 'La descripción no puede superar 500 caracteres')
    .default(''),
  level: z.enum(['basic', 'intermediate'], {
    errorMap: () => ({ message: "El nivel debe ser 'basic' o 'intermediate'" }),
  }),
  iconEmoji: z.string().optional(),
  order: z
    .number()
    .int('El orden debe ser un entero')
    .min(0, 'El orden no puede ser negativo')
    .default(0),
  isPublished: z.boolean().default(false),
});

// slug is immutable post-creation — omitted from update schema (REQ-014)
export const CourseUpdateSchema = CourseCreateSchema.omit({ slug: true })
  .partial()
  .extend({
    updatedAt: z.string().datetime('updatedAt debe ser una fecha ISO válida'), // optimistic locking
  });

