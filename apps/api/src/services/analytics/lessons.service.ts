import mongoose from 'mongoose';
import { ProgressModel } from '../../models/Progress.model';
import { LessonModel } from '../../models/Lesson.model';
import { ModuleModel } from '../../models/Module.model';
import { ExerciseAttemptModel } from '../../models/ExerciseAttempt.model';
import type { AnalyticsLesson, AnalyticsLessonsResponse, ExerciseAnalyticsItem, ExercisesAnalyticsResponse } from '@senatic/shared';
import { defaultRange, type QueryParams, type LessonStatsRow, type ExerciseStatsRow } from './base';

export async function getLessonsStats(params: QueryParams = {}): Promise<AnalyticsLessonsResponse> {
  const { from, to } = defaultRange(params.from, params.to);
  const dateFilter = { completedAt: { $gte: from, $lte: to } };

  const matchStage: Record<string, unknown> = { ...dateFilter };
  if (params.courseId) {
    const modules = await ModuleModel.find(
      { courseId: new mongoose.Types.ObjectId(params.courseId) },
      '_id',
    );
    const moduleIds = modules.map((m) => m._id);
    const lessons = await LessonModel.find({ moduleId: { $in: moduleIds } }, '_id');
    matchStage['lessonId'] = { $in: lessons.map((l) => l._id) };
  }

  const agg = await ProgressModel.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$lessonId',
        totalAttempts: { $sum: 1 },
        completions: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        avgTimeMs: {
          $avg: {
            $cond: [
              { $and: ['$completedAt', '$createdAt'] },
              { $subtract: ['$completedAt', '$createdAt'] },
              null,
            ],
          },
        },
      },
    },
    { $lookup: { from: 'lessons', localField: '_id', foreignField: '_id', as: 'lesson' } },
    { $unwind: { path: '$lesson', preserveNullAndEmptyArrays: true } },
    { $lookup: { from: 'modules', localField: 'lesson.moduleId', foreignField: '_id', as: 'module' } },
    { $unwind: { path: '$module', preserveNullAndEmptyArrays: true } },
    { $lookup: { from: 'courses', localField: 'module.courseId', foreignField: '_id', as: 'course' } },
    { $unwind: { path: '$course', preserveNullAndEmptyArrays: true } },
    { $sort: { completions: -1 } },
  ]);

  const lessons: AnalyticsLesson[] = agg.map((row: LessonStatsRow) => ({
    lessonId: String(row._id),
    title: row.lesson?.title ?? '(sin título)',
    courseId: String(row.module?.courseId ?? ''),
    courseTitle: row.course?.title ?? '(sin curso)',
    totalAttempts: row.totalAttempts,
    completions: row.completions,
    completionRate: row.totalAttempts > 0 ? row.completions / row.totalAttempts : 0,
    avgTimeSeconds: row.avgTimeMs ? Math.round(row.avgTimeMs / 1000) : 0,
  }));

  return { lessons, total: lessons.length };
}

export async function getExercisesAnalytics(lessonId?: string): Promise<ExercisesAnalyticsResponse> {
  const matchStage: Record<string, unknown> = {};
  if (lessonId) matchStage.lessonId = new mongoose.Types.ObjectId(lessonId);

  const agg = await ExerciseAttemptModel.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: { lessonId: '$lessonId', exerciseIndex: '$exerciseIndex' },
        totalStudents: { $sum: 1 },
        passedStudents: { $sum: { $cond: ['$passed', 1, 0] } },
        avgAttempts: { $avg: '$attempts' },
        avgHints: { $avg: '$hintsUsed' },
        exerciseTitle: { $first: '$exerciseTitle' },
      },
    },
    { $lookup: { from: 'lessons', localField: '_id.lessonId', foreignField: '_id', as: 'lesson' } },
    { $unwind: { path: '$lesson', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 0,
        lessonId: '$_id.lessonId',
        lessonTitle: { $ifNull: ['$lesson.title', '(sin título)'] },
        exerciseIndex: '$_id.exerciseIndex',
        exerciseTitle: 1,
        totalStudents: 1,
        passedStudents: 1,
        passRate: {
          $cond: [{ $gt: ['$totalStudents', 0] }, { $divide: ['$passedStudents', '$totalStudents'] }, 0],
        },
        avgAttempts: { $round: ['$avgAttempts', 1] },
        avgHints: { $round: ['$avgHints', 1] },
      },
    },
    { $sort: { lessonId: 1, exerciseIndex: 1 } },
  ]);

  const exercises: ExerciseAnalyticsItem[] = agg.map((row: ExerciseStatsRow) => ({
    lessonId: String(row.lessonId),
    lessonTitle: row.lessonTitle,
    exerciseIndex: row.exerciseIndex,
    exerciseTitle: row.exerciseTitle || `Ejercicio ${row.exerciseIndex + 1}`,
    totalStudents: row.totalStudents,
    passedStudents: row.passedStudents,
    passRate: row.passRate,
    avgAttempts: row.avgAttempts,
    avgHints: row.avgHints,
  }));

  return { exercises, total: exercises.length };
}
