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

export type CourseCreateInput = z.infer<typeof CourseCreateSchema>;
export type CourseUpdateInput = z.infer<typeof CourseUpdateSchema>;

export type ModuleCreateInput = z.infer<typeof ModuleCreateSchema>;
export type ModuleUpdateInput = z.infer<typeof ModuleUpdateSchema>;

export type LessonCreateInput = z.infer<typeof LessonCreateSchema>;
export type LessonUpdateInput = z.infer<typeof LessonUpdateSchema>;

export type ExampleInput = z.infer<typeof ExampleSchema>;
export type ExerciseInput = z.infer<typeof ExerciseSchema>;
export type LessonContentInput = z.infer<typeof LessonContentSchema>;

export type ReorderInput = z.infer<typeof ReorderSchema>;

export type PromoteDemoteInput = z.infer<typeof PromoteDemoteSchema>;

export type AuditQueryInput = z.infer<typeof AuditQuerySchema>;
