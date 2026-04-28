import mongoose from 'mongoose';
import { UserModel } from '../../models/User.model';
import { ProgressModel } from '../../models/Progress.model';
import { LessonModel } from '../../models/Lesson.model';
import type {
  DailyPoint,
  StudentSummary,
  StudentsListResponse,
  StudentLessonProgress,
  StudentProfile,
} from '@senatic/shared';
import { MS_PER_DAY, DEFAULT_RANGE_DAYS } from '../../lib/constants';
import {
  defaultRange,
  fillDateGaps,
  type CompletedLessonsRow,
  type ProgressAggRow,
  type DateCountRow,
  type UserLeanDoc,
} from './base';

export async function getStudentList(): Promise<StudentsListResponse> {
  const [users, completedAgg] = await Promise.all([
    UserModel.find({}, 'displayName email xp level streak lastActiveDate').lean(),
    ProgressModel.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: '$userId', completedLessons: { $sum: 1 } } },
    ]),
  ]);

  const completedMap = new Map<string, number>(
    completedAgg.map((p: CompletedLessonsRow) => [String(p._id), p.completedLessons]),
  );

  const students: StudentSummary[] = (users as UserLeanDoc[]).map((u) => ({
    id: String(u._id),
    displayName: u.displayName,
    email: u.email,
    xp: u.xp,
    level: u.level,
    streak: u.streak,
    lastActiveDate: u.lastActiveDate ? (u.lastActiveDate as Date).toISOString() : null,
    completedLessons: completedMap.get(String(u._id)) ?? 0,
  }));

  students.sort((a, b) => b.xp - a.xp);

  return { students, total: students.length };
}

export async function getStudentProfile(userId: string): Promise<StudentProfile | null> {
  const uid = new mongoose.Types.ObjectId(userId);

  const [user, progressAgg, totalLessons] = await Promise.all([
    UserModel.findById(uid, 'displayName email xp level streak lastActiveDate').lean(),
    ProgressModel.aggregate([
      { $match: { userId: uid } },
      { $lookup: { from: 'lessons', localField: 'lessonId', foreignField: '_id', as: 'lesson' } },
      { $unwind: { path: '$lesson', preserveNullAndEmptyArrays: true } },
      { $lookup: { from: 'modules', localField: 'lesson.moduleId', foreignField: '_id', as: 'module' } },
      { $unwind: { path: '$module', preserveNullAndEmptyArrays: true } },
      { $lookup: { from: 'courses', localField: 'module.courseId', foreignField: '_id', as: 'course' } },
      { $unwind: { path: '$course', preserveNullAndEmptyArrays: true } },
      { $sort: { 'module.order': 1, 'lesson.order': 1 } },
    ]),
    LessonModel.countDocuments({ isPublished: true }),
  ]);

  if (!user) return null;

  const progress: StudentLessonProgress[] = progressAgg.map((p: ProgressAggRow) => ({
    lessonId: String(p.lessonId),
    lessonTitle: p.lesson?.title ?? '(sin título)',
    moduleTitle: p.module?.title ?? '(sin módulo)',
    status: p.status,
    xpEarned: p.xpEarned,
    attempts: p.attempts,
    hintsUsed: p.hintsUsed,
    completedAt: p.completedAt ? (p.completedAt as Date).toISOString() : null,
  }));

  const to = new Date();
  const from = new Date(to.getTime() - DEFAULT_RANGE_DAYS * MS_PER_DAY);

  const dailyAgg = await ProgressModel.aggregate([
    {
      $match: {
        userId: uid,
        status: 'completed',
        completedAt: { $gte: from, $lte: to },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$completedAt' } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const rawPoints: DailyPoint[] = dailyAgg.map((d: DateCountRow) => ({ date: d._id, count: d.count }));
  const dailyActivity = fillDateGaps(rawPoints, from, to);

  const u = user as UserLeanDoc;
  return {
    id: String(u._id),
    displayName: u.displayName,
    email: u.email,
    xp: u.xp,
    level: u.level,
    streak: u.streak,
    lastActiveDate: u.lastActiveDate ? u.lastActiveDate.toISOString() : null,
    completedLessons: progress.filter((p) => p.status === 'completed').length,
    totalLessons,
    dailyActivity,
    progress,
  };
}
