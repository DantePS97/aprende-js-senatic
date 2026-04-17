import type { z } from 'zod';
import type {
  CourseCreateSchema,
  CourseUpdateSchema,
  ModuleCreateSchema,
  ModuleUpdateSchema,
  LessonCreateSchema,
  LessonUpdateSchema,
  LessonContentSchema,
  ExampleSchema,
  ExerciseSchema,
  ReorderSchema,
  PromoteDemoteSchema,
  AuditQuerySchema,
} from '../schemas/admin';

// z.input gives the type BEFORE defaults are applied (order?, isPublished? are optional)
// z.infer gives the type AFTER defaults are applied (all fields required) — wrong for form payloads
export type CourseCreateInput = z.input<typeof CourseCreateSchema>;
export type CourseUpdateInput = z.input<typeof CourseUpdateSchema>;

export type ModuleCreateInput = z.input<typeof ModuleCreateSchema>;
export type ModuleUpdateInput = z.input<typeof ModuleUpdateSchema>;

export type LessonCreateInput = z.input<typeof LessonCreateSchema>;
export type LessonUpdateInput = z.input<typeof LessonUpdateSchema>;

export type ExampleInput = z.infer<typeof ExampleSchema>;
export type ExerciseInput = z.infer<typeof ExerciseSchema>;
export type LessonContentInput = z.infer<typeof LessonContentSchema>;

export type ReorderInput = z.infer<typeof ReorderSchema>;

export type PromoteDemoteInput = z.infer<typeof PromoteDemoteSchema>;

export type AuditQueryInput = z.infer<typeof AuditQuerySchema>;
