import mongoose from 'mongoose';
import { MS_PER_DAY, DEFAULT_RANGE_DAYS } from '../../lib/constants';
import type { DailyPoint } from '@senatic/shared';

// ─── Shared query params ──────────────────────────────────────────────────────

export interface QueryParams {
  from?: Date;
  to?: Date;
  courseId?: string;
}

// ─── Aggregation result shapes ────────────────────────────────────────────────

export interface DateCountRow      { _id: string; count: number }
export interface StreakBucketRow   { _id: number | '31+'; count: number }
export interface WeeklyRow         { _id: { year: number; week: number }; count: number }
export interface CompletedCountRow { _id: mongoose.Types.ObjectId }
export interface CompletedLessonsRow { _id: mongoose.Types.ObjectId; completedLessons: number }

export interface LessonStatsRow {
  _id: mongoose.Types.ObjectId;
  totalAttempts: number;
  completions: number;
  avgTimeMs: number | null;
  lesson?:  { title?: string; moduleId?: mongoose.Types.ObjectId };
  module?:  { title?: string; courseId?: mongoose.Types.ObjectId; order?: number };
  course?:  { title?: string };
}

export interface ProgressAggRow {
  lessonId: mongoose.Types.ObjectId;
  status: 'not_started' | 'in_progress' | 'completed';
  xpEarned: number;
  attempts: number;
  hintsUsed: number;
  completedAt?: Date;
  lesson?:  { title?: string; moduleId?: mongoose.Types.ObjectId };
  module?:  { title?: string; courseId?: mongoose.Types.ObjectId; order?: number };
}

export interface ExerciseStatsRow {
  lessonId: mongoose.Types.ObjectId;
  lessonTitle: string;
  exerciseIndex: number;
  exerciseTitle: string;
  totalStudents: number;
  passedStudents: number;
  passRate: number;
  avgAttempts: number;
  avgHints: number;
}

export interface UserLeanDoc {
  _id: mongoose.Types.ObjectId;
  displayName: string;
  email: string;
  xp: number;
  level: number;
  streak: number;
  lastActiveDate?: Date;
}

// ─── Utilities ────────────────────────────────────────────────────────────────

export function defaultRange(from?: Date, to?: Date): { from: Date; to: Date } {
  const t = to ?? new Date();
  const f = from ?? new Date(t.getTime() - DEFAULT_RANGE_DAYS * MS_PER_DAY);
  return { from: f, to: t };
}

export function fillDateGaps(points: DailyPoint[], from: Date, to: Date): DailyPoint[] {
  const map = new Map(points.map((p) => [p.date, p.count]));
  const result: DailyPoint[] = [];
  const cursor = new Date(from);
  cursor.setUTCHours(0, 0, 0, 0);
  const end = new Date(to);
  end.setUTCHours(0, 0, 0, 0);

  while (cursor <= end) {
    const key = cursor.toISOString().slice(0, 10);
    result.push({ date: key, count: map.get(key) ?? 0 });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return result;
}
