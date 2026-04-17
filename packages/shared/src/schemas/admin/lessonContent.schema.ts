import { z } from 'zod';

export const ExampleSchema = z.object({
  code: z.string().min(1, 'El código del ejemplo no puede estar vacío'),
  explanation: z.string().default(''),
});

export const ExerciseSchema = z.object({
  title: z.string().default(''),
  prompt: z.string().default(''),
  startCode: z.string().min(1, 'startCode no puede estar vacío'),
  tests: z.string().min(1, 'tests no puede estar vacío'),
  hints: z
    .array(z.string())
    .max(10, 'Máximo 10 hints por ejercicio'),
});

export const LessonContentSchema = z.object({
  theory: z.object({
    markdown: z.string().max(50000, 'El markdown no puede superar 50 000 caracteres'),
    examples: z.array(ExampleSchema).max(20, 'Máximo 20 ejemplos por lección'),
  }),
  exercises: z.array(ExerciseSchema).max(30, 'Máximo 30 ejercicios por lección'),
  /** ISO string sent by the client for optimistic concurrency detection */
  updatedAt: z.string().optional(),
});

