import { z } from 'zod';

export * from './admin';

// ─── Auth schemas ─────────────────────────────────────────────────────────────

export const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(72, 'Contraseña demasiado larga'),
  displayName: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'Nombre demasiado largo')
    .regex(/^[a-zA-ZÀ-ÿ0-9\s._-]+$/, 'Nombre contiene caracteres no permitidos'),
});

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

// ─── Progress schemas ─────────────────────────────────────────────────────────

export const submitProgressSchema = z.object({
  lessonId: z.string().min(1),
  passed: z.boolean(),
  hintsUsed: z.number().int().min(0).max(10),
  completedAt: z.string().datetime(),
});

// ─── Sync schema ──────────────────────────────────────────────────────────────

export const syncEventSchema = z.object({
  lessonId: z.string().min(1),
  passed: z.boolean(),
  hintsUsed: z.number().int().min(0).max(10),
  completedAt: z.string().datetime(),
  localId: z.string().min(1),
});

export const syncRequestSchema = z.object({
  events: z.array(syncEventSchema).min(1).max(100),
});

// ─── Forum schemas ────────────────────────────────────────────────────────────

export const createPostSchema = z.object({
  title: z.string().min(5, 'El título debe tener al menos 5 caracteres').max(120),
  body: z.string().min(20, 'La pregunta debe tener al menos 20 caracteres').max(5000),
  tags: z.array(z.string().min(1).max(30)).max(5).default([]),
});

export const createReplySchema = z.object({
  body: z.string().min(5, 'La respuesta debe tener al menos 5 caracteres').max(3000),
});

// ─── Inferred types ───────────────────────────────────────────────────────────

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type SubmitProgressInput = z.infer<typeof submitProgressSchema>;
export type SyncRequestInput = z.infer<typeof syncRequestSchema>;
export type CreatePostInput = z.infer<typeof createPostSchema>;
export type CreateReplyInput = z.infer<typeof createReplySchema>;
