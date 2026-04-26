import mongoose from 'mongoose';
import { UserModel } from '../models/User.model';
import { ProgressModel } from '../models/Progress.model';
import { LessonModel } from '../models/Lesson.model';
import { ModuleModel } from '../models/Module.model';
import { CourseModel } from '../models/Course.model';
import { ExerciseAttemptModel } from '../models/ExerciseAttempt.model';
import type {
  DailyPoint,
  AnalyticsOverview,
  AnalyticsLesson,
  AnalyticsLessonsResponse,
  StreakBucket,
  StreakBucketLabel,
  AnalyticsRetention,
  FunnelStage,
  AnalyticsFunnel,
  StudentSummary,
  StudentsListResponse,
  StudentLessonProgress,
  StudentProfile,
  ExerciseAnalyticsItem,
  ExercisesAnalyticsResponse,
  HeatmapCell,
  ActivityHeatmapResponse,
} from '@senatic/shared';

interface QueryParams {
  from?: Date;
  to?: Date;
  courseId?: string;
}

// ─── Aggregation result shapes ────────────────────────────────────────────────

interface DateCountRow      { _id: string; count: number }
interface StreakBucketRow   { _id: number | '31+'; count: number }
interface WeeklyRow         { _id: { year: number; week: number }; count: number }
interface CompletedCountRow { _id: mongoose.Types.ObjectId }
interface CompletedLessonsRow { _id: mongoose.Types.ObjectId; completedLessons: number }

interface LessonStatsRow {
  _id: mongoose.Types.ObjectId;
  totalAttempts: number;
  completions: number;
  avgTimeMs: number | null;
  lesson?:  { title?: string; moduleId?: mongoose.Types.ObjectId };
  module?:  { title?: string; courseId?: mongoose.Types.ObjectId; order?: number };
  course?:  { title?: string };
}

interface ProgressAggRow {
  lessonId: mongoose.Types.ObjectId;
  status: 'not_started' | 'in_progress' | 'completed';
  xpEarned: number;
  attempts: number;
  hintsUsed: number;
  completedAt?: Date;
  lesson?:  { title?: string; moduleId?: mongoose.Types.ObjectId };
  module?:  { title?: string; courseId?: mongoose.Types.ObjectId; order?: number };
}

interface ExerciseStatsRow {
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

interface UserLeanDoc {
  _id: mongoose.Types.ObjectId;
  displayName: string;
  email: string;
  xp: number;
  level: number;
  streak: number;
  lastActiveDate?: Date;
}

function defaultRange(from?: Date, to?: Date): { from: Date; to: Date } {
  const t = to ?? new Date();
  const f = from ?? new Date(t.getTime() - 30 * 86400000);
  return { from: f, to: t };
}

function fillDateGaps(points: DailyPoint[], from: Date, to: Date): DailyPoint[] {
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

// ─── Overview ─────────────────────────────────────────────────────────────────

export async function getOverview(params: QueryParams = {}): Promise<AnalyticsOverview> {
  const { from, to } = defaultRange(params.from, params.to);

  const dateFilter = { completedAt: { $gte: from, $lte: to } };

  const [
    totalUsers,
    totalLessonsCompleted,
    activeUserIds,
    levelAgg,
    dailyAgg,
    completionRateAgg,
  ] = await Promise.all([
    UserModel.countDocuments(),
    ProgressModel.countDocuments({ status: 'completed', ...dateFilter }),
    ProgressModel.distinct('userId', { status: 'completed', ...dateFilter }),
    UserModel.aggregate([
      { $group: { _id: '$level', count: { $sum: 1 } } },
    ]),
    ProgressModel.aggregate([
      { $match: { status: 'completed', ...dateFilter } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$completedAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    ProgressModel.aggregate([
      {
        $group: {
          _id: '$lessonId',
          total: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        },
      },
      {
        $project: {
          rate: { $cond: [{ $gt: ['$total', 0] }, { $divide: ['$completed', '$total'] }, 0] },
        },
      },
      { $group: { _id: null, avg: { $avg: '$rate' } } },
    ]),
  ]);

  const levelDistribution: Record<string, number> = {};
  for (const l of levelAgg) levelDistribution[String(l._id)] = l.count;

  const rawPoints: DailyPoint[] = dailyAgg.map((d: DateCountRow) => ({ date: d._id, count: d.count }));
  const dailyCompletions = fillDateGaps(rawPoints, from, to);

  return {
    totalUsers,
    activeUsers: activeUserIds.length,
    totalLessonsCompleted,
    avgCompletionRate: completionRateAgg[0]?.avg ?? 0,
    levelDistribution,
    dailyCompletions,
  };
}

// ─── Lessons stats ────────────────────────────────────────────────────────────

export async function getLessonsStats(params: QueryParams = {}): Promise<AnalyticsLessonsResponse> {
  const { from, to } = defaultRange(params.from, params.to);
  const dateFilter = { completedAt: { $gte: from, $lte: to } };

  const matchStage: Record<string, unknown> = { ...dateFilter };
  if (params.courseId) {
    // Filter by lessonIds that belong to the course
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
    {
      $lookup: {
        from: 'lessons',
        localField: '_id',
        foreignField: '_id',
        as: 'lesson',
      },
    },
    { $unwind: { path: '$lesson', preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: 'modules',
        localField: 'lesson.moduleId',
        foreignField: '_id',
        as: 'module',
      },
    },
    { $unwind: { path: '$module', preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: 'courses',
        localField: 'module.courseId',
        foreignField: '_id',
        as: 'course',
      },
    },
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

// ─── Retention ────────────────────────────────────────────────────────────────

export async function getRetention(params: QueryParams = {}): Promise<AnalyticsRetention> {
  const { from, to } = defaultRange(params.from, params.to);

  const [dauAgg, weeklyAgg, streakAgg] = await Promise.all([
    ProgressModel.aggregate([
      { $match: { updatedAt: { $gte: from, $lte: to } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$updatedAt' } },
          count: { $addToSet: '$userId' },
        },
      },
      { $project: { _id: 1, count: { $size: '$count' } } },
      { $sort: { _id: 1 } },
    ]),
    ProgressModel.aggregate([
      { $match: { updatedAt: { $gte: from, $lte: to } } },
      {
        $group: {
          _id: {
            year: { $isoWeekYear: '$updatedAt' },
            week: { $isoWeek: '$updatedAt' },
          },
          users: { $addToSet: '$userId' },
        },
      },
      { $project: { _id: 1, count: { $size: '$users' } } },
      { $sort: { '_id.year': 1, '_id.week': 1 } },
    ]),
    UserModel.aggregate([
      {
        $bucket: {
          groupBy: '$streak',
          boundaries: [0, 1, 4, 8, 15, 31],
          default: '31+',
          output: { count: { $sum: 1 } },
        },
      },
    ]),
  ]);

  const dailyActiveUsers = fillDateGaps(
    dauAgg.map((d: DateCountRow) => ({ date: d._id, count: d.count })),
    from,
    to,
  );

  const bucketLabels: StreakBucketLabel[] = ['0', '1-3', '4-7', '8-14', '15-30', '31+'];
  const streakBuckets: StreakBucket[] = streakAgg.map((b: StreakBucketRow, i: number) => ({
    bucket: (b._id === '31+' ? '31+' : bucketLabels[i] ?? '31+') as StreakBucketLabel,
    count: b.count,
  }));

  const weeklyRetention: DailyPoint[] = weeklyAgg.map((w: WeeklyRow) => ({
    date: `${w._id.year}-W${String(w._id.week).padStart(2, '0')}`,
    count: w.count,
  }));

  return { dailyActiveUsers, weeklyRetention, streakBuckets };
}

// ─── Funnel ───────────────────────────────────────────────────────────────────

export async function getFunnel(params: QueryParams & { courseId: string }): Promise<AnalyticsFunnel> {
  const course = await CourseModel.findById(params.courseId);
  const courseTitle = course?.title ?? '(sin curso)';

  const modules = await ModuleModel.find(
    { courseId: new mongoose.Types.ObjectId(params.courseId) },
    '_id',
  ).sort({ order: 1 });

  const moduleIds = modules.map((m) => m._id);
  const lessons = await LessonModel.find(
    { moduleId: { $in: moduleIds } },
    '_id',
  ).sort({ order: 1 });

  const lessonIds = lessons.map((l) => l._id);

  if (lessonIds.length === 0) {
    return { courseId: params.courseId, courseTitle, stages: [] };
  }

  const firstLesson = lessonIds[0];
  const midIndex = Math.floor(lessonIds.length / 2);

  const [enrolled, startedFirst, completedFirst, completedMid, completedAll] = await Promise.all([
    ProgressModel.distinct('userId', { lessonId: { $in: lessonIds } }),
    ProgressModel.distinct('userId', { lessonId: firstLesson, status: { $in: ['in_progress', 'completed'] } }),
    ProgressModel.distinct('userId', { lessonId: firstLesson, status: 'completed' }),
    ProgressModel.distinct('userId', { lessonId: lessonIds[midIndex], status: 'completed' }),
    (async () => {
      const completedCounts = await ProgressModel.aggregate([
        { $match: { lessonId: { $in: lessonIds }, status: 'completed' } },
        { $group: { _id: '$userId', count: { $sum: 1 } } },
        { $match: { count: { $gte: lessonIds.length } } },
      ]);
      return completedCounts.map((r: CompletedCountRow) => r._id);
    })(),
  ]);

  const counts = [
    enrolled.length,
    startedFirst.length,
    completedFirst.length,
    completedMid.length,
    completedAll.length,
  ];

  const stageNames = [
    'Inscrito',
    'Inició lección 1',
    'Completó lección 1',
    `Completó lección ${midIndex + 1}`,
    'Completó todo el curso',
  ];

  const stages: FunnelStage[] = stageNames.map((stage, i) => ({
    stage,
    count: counts[i],
    dropoffRate: i === 0 || counts[i - 1] === 0 ? 0 : (counts[i - 1] - counts[i]) / counts[i - 1],
  }));

  return { courseId: params.courseId, courseTitle, stages };
}

// ─── Students list ────────────────────────────────────────────────────────────

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

  // Sort by XP desc by default
  students.sort((a, b) => b.xp - a.xp);

  return { students, total: students.length };
}

// ─── Student profile ──────────────────────────────────────────────────────────

export async function getStudentProfile(userId: string): Promise<StudentProfile | null> {
  const uid = new mongoose.Types.ObjectId(userId);

  const [user, progressAgg, totalLessons] = await Promise.all([
    UserModel.findById(uid, 'displayName email xp level streak lastActiveDate').lean(),
    ProgressModel.aggregate([
      { $match: { userId: uid } },
      {
        $lookup: {
          from: 'lessons',
          localField: 'lessonId',
          foreignField: '_id',
          as: 'lesson',
        },
      },
      { $unwind: { path: '$lesson', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'modules',
          localField: 'lesson.moduleId',
          foreignField: '_id',
          as: 'module',
        },
      },
      { $unwind: { path: '$module', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'courses',
          localField: 'module.courseId',
          foreignField: '_id',
          as: 'course',
        },
      },
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

  // Daily activity — last 30 days, completions per day
  const to = new Date();
  const from = new Date(to.getTime() - 30 * 86400000);

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

// ─── Exercise analytics ───────────────────────────────────────────────────────

export async function getExercisesAnalytics(
  lessonId?: string,
): Promise<ExercisesAnalyticsResponse> {
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
    {
      $lookup: {
        from: 'lessons',
        localField: '_id.lessonId',
        foreignField: '_id',
        as: 'lesson',
      },
    },
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
          $cond: [
            { $gt: ['$totalStudents', 0] },
            { $divide: ['$passedStudents', '$totalStudents'] },
            0,
          ],
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

// ─── Activity heatmap ─────────────────────────────────────────────────────────

// Colombia = America/Bogota = UTC-5 (sin horario de verano)
const BOGOTA_TZ = 'America/Bogota';

// $dayOfWeek en MongoDB: 1=domingo … 7=sábado
// Convertimos a 0=lunes … 6=domingo
function mongoWeekdayToISO(dow: number): number {
  // MongoDB: 1=Dom, 2=Lun, 3=Mar, 4=Mié, 5=Jue, 6=Vie, 7=Sáb
  // ISO: 0=Lun, 1=Mar, 2=Mié, 3=Jue, 4=Vie, 5=Sáb, 6=Dom
  return dow === 1 ? 6 : dow - 2;
}

export async function getActivityHeatmap(
  params: QueryParams = {},
): Promise<ActivityHeatmapResponse> {
  const { from, to } = defaultRange(params.from, params.to);

  const agg = await ProgressModel.aggregate([
    {
      $match: {
        status: 'completed',
        completedAt: { $gte: from, $lte: to },
      },
    },
    {
      $group: {
        _id: {
          day: { $dayOfWeek: { date: '$completedAt', timezone: BOGOTA_TZ } },
          hour: { $hour: { date: '$completedAt', timezone: BOGOTA_TZ } },
        },
        count: { $sum: 1 },
      },
    },
  ]);

  // Construir mapa completo 7×24 (todas las celdas, incluso con count=0)
  const countMap = new Map<string, number>();
  for (const row of agg) {
    const day = mongoWeekdayToISO(row._id.day);
    const key = `${day}:${row._id.hour}`;
    countMap.set(key, row.count);
  }

  const cells: HeatmapCell[] = [];
  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      cells.push({ day, hour, count: countMap.get(`${day}:${hour}`) ?? 0 });
    }
  }

  const maxCount = Math.max(...cells.map((c) => c.count), 1);
  const totalCompletions = cells.reduce((s, c) => s + c.count, 0);

  // Día con más actividad
  const dayTotals = Array.from({ length: 7 }, (_, d) =>
    cells.filter((c) => c.day === d).reduce((s, c) => s + c.count, 0),
  );
  const peakDay = dayTotals.indexOf(Math.max(...dayTotals));

  // Hora con más actividad
  const hourTotals = Array.from({ length: 24 }, (_, h) =>
    cells.filter((c) => c.hour === h).reduce((s, c) => s + c.count, 0),
  );
  const peakHour = hourTotals.indexOf(Math.max(...hourTotals));

  return { cells, maxCount, totalCompletions, peakDay, peakHour };
}
