import { z } from 'zod';

// ─── Difficulty ───────────────────────────────────────────────────────────────

export const difficultySchema = z.enum(['facil', 'medio', 'dificil']);
export type Difficulty = z.infer<typeof difficultySchema>;

// ─── Test Case ────────────────────────────────────────────────────────────────

export const testCaseSchema = z.object({
  input: z.string().min(1, 'El input es requerido'),
  expectedOutput: z.string().min(1, 'El output esperado es requerido'),
  hidden: z.boolean().default(false),
  description: z.string().max(200).optional(),
});
export type TestCase = z.infer<typeof testCaseSchema>;

// ─── Challenge ────────────────────────────────────────────────────────────────

export const challengeSchema = z.object({
  _id: z.string(),
  slug: z.string().min(1).max(100),
  title: z.string().min(3).max(120),
  description: z.string().min(10).max(10000),
  difficulty: difficultySchema,
  xpReward: z.number().int().min(1).max(500),
  starterCode: z.string().min(1).max(50000),
  testCases: z.array(testCaseSchema).min(1).max(20),
  order: z.number().int().min(1),
  published: z.boolean().default(false),
  tags: z.array(z.string().min(1).max(30)).max(10).default([]),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Challenge = z.infer<typeof challengeSchema>;

// ─── ChallengeListItem ────────────────────────────────────────────────────────

export const challengeListItemSchema = challengeSchema
  .omit({ testCases: true, starterCode: true, description: true })
  .extend({
    isSolved: z.boolean(),
    isUnlocked: z.boolean(),
    solvedAt: z.string().datetime().nullable(),
  });
export type ChallengeListItem = z.infer<typeof challengeListItemSchema>;

// ─── ChallengeAttempt ─────────────────────────────────────────────────────────

export const challengeAttemptSchema = z.object({
  _id: z.string(),
  userId: z.string(),
  challengeId: z.string(),
  code: z.string().min(1).max(50000),
  passed: z.boolean(),
  testsPassedCount: z.number().int().min(0),
  totalTests: z.number().int().min(1),
  submittedAt: z.string().datetime(),
});
export type ChallengeAttempt = z.infer<typeof challengeAttemptSchema>;

// ─── ChallengeProgress ────────────────────────────────────────────────────────

export const challengeProgressStatusSchema = z.enum(['unsolved', 'solved']);
export type ChallengeProgressStatus = z.infer<typeof challengeProgressStatusSchema>;

export const challengeProgressSchema = z.object({
  _id: z.string(),
  userId: z.string(),
  challengeId: z.string(),
  status: challengeProgressStatusSchema,
  firstSolvedAt: z.string().datetime().nullable(),
  xpAwarded: z.number().int().min(0),
});
export type ChallengeProgress = z.infer<typeof challengeProgressSchema>;

// ─── Submit input ─────────────────────────────────────────────────────────────

export const submitChallengeSchema = z.object({
  code: z
    .string()
    .min(1, 'El código no puede estar vacío')
    .max(50000, 'El código supera el límite de caracteres permitidos'),
});
export type SubmitChallengeInput = z.infer<typeof submitChallengeSchema>;

// ─── Unlock status ────────────────────────────────────────────────────────────

export const unlockStatusSchema = z.object({
  unlocked: z.boolean(),
  requiredCourseSlug: z.literal('javascript-basico'),
  completedLessons: z.number().int().min(0),
  totalLessons: z.number().int().min(0),
  progressPercent: z.number().min(0).max(100),
});
export type UnlockStatus = z.infer<typeof unlockStatusSchema>;

// ─── Submit response ──────────────────────────────────────────────────────────

export const submitChallengeResponseSchema = z.object({
  passed: z.boolean(),
  testsPassedCount: z.number().int().min(0),
  totalTests: z.number().int().min(1),
  testResults: z.array(
    z.object({
      passed: z.boolean(),
      description: z.string().optional(),
    })
  ),
  xpAwarded: z.number().int().min(0),
  firstSolve: z.boolean(),
  newAchievements: z.array(z.any()),
});
export type SubmitChallengeResponse = z.infer<typeof submitChallengeResponseSchema>;
