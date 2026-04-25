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

// ─── Password Reset schemas ───────────────────────────────────────────────────

export const forgotPasswordSchema = z.object({
  email: z.string().email('Email inválido'),
});

const passwordSchema = z
  .string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .max(72, 'Contraseña demasiado larga');

export const resetPasswordSchema = z.object({
  token: z.string().length(64, 'Token inválido'),
  newPassword: passwordSchema,
});

export const validateResetTokenSchema = z.object({
  token: z.string().length(64, 'Token inválido'),
});

// ─── Preferences schemas ──────────────────────────────────────────────────────

export const userPreferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).default('dark'),
  accentColor: z.enum(['indigo', 'emerald', 'rose', 'amber', 'violet']).default('indigo'),
  editorTheme: z.enum(['oneDark', 'dracula', 'githubLight', 'material']).default('oneDark'),
  fontSize: z.enum(['normal', 'large']).default('normal'),
});

export const updatePreferencesSchema = userPreferencesSchema.partial().strict();

export type UserPreferences = z.infer<typeof userPreferencesSchema>;
export type UpdatePreferencesInput = z.infer<typeof updatePreferencesSchema>;

// ─── League schemas ───────────────────────────────────────────────────────────

export const tierSchema = z.enum(['gold', 'silver', 'bronze']);
export type Tier = z.infer<typeof tierSchema>;

export const weeklyLeagueEntrySchema = z.object({
  userId: z.string(),
  displayName: z.string(),
  avatarUrl: z.string().nullable(),
  level: z.number(),
  weeklyXp: z.number(),
  rank: z.number(),
});
export type WeeklyLeagueEntry = z.infer<typeof weeklyLeagueEntrySchema>;

export const userLeagueStatusSchema = z.object({
  tier: tierSchema.nullable(),
  weeklyXp: z.number(),
  weekStart: z.string(), // ISO date string (YYYY-MM-DD)
});
export type UserLeagueStatus = z.infer<typeof userLeagueStatusSchema>;

export const weeklyLeagueResponseSchema = z.object({
  weekStart: z.string(),
  weekEnd: z.string(),
  gold: z.array(weeklyLeagueEntrySchema),
  silver: z.array(weeklyLeagueEntrySchema),
  bronze: z.array(weeklyLeagueEntrySchema),
});
export type WeeklyLeagueResponse = z.infer<typeof weeklyLeagueResponseSchema>;

// ─── Inferred types ───────────────────────────────────────────────────────────

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type SubmitProgressInput = z.infer<typeof submitProgressSchema>;
export type SyncRequestInput = z.infer<typeof syncRequestSchema>;
export type CreatePostInput = z.infer<typeof createPostSchema>;
export type CreateReplyInput = z.infer<typeof createReplySchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
