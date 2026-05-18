import { z } from 'zod';
import { difficultySchema, testCaseSchema } from '../challenges.schema';

export const AdminChallengeCreateSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'Slug solo puede contener letras minúsculas, números y guiones')
    .optional(),
  title: z.string().min(3).max(120),
  description: z.string().min(10).max(10000),
  difficulty: difficultySchema,
  xpReward: z.number().int().min(1).max(500),
  starterCode: z.string().min(1).max(50000),
  testCases: z.array(testCaseSchema).min(1).max(20),
  published: z.boolean().default(false),
  tags: z.array(z.string().min(1).max(30)).max(10).default([]),
});

export const AdminChallengeUpdateSchema = AdminChallengeCreateSchema.partial();

export type AdminChallengeCreateInput = z.infer<typeof AdminChallengeCreateSchema>;
export type AdminChallengeUpdateInput = z.infer<typeof AdminChallengeUpdateSchema>;
