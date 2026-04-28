import mongoose from 'mongoose';
import { CourseModel } from '../../models/Course.model';
import { ModuleModel } from '../../models/Module.model';
import { LessonModel } from '../../models/Lesson.model';
import { ProgressModel } from '../../models/Progress.model';
import type { AnalyticsFunnel, FunnelStage } from '@senatic/shared';
import type { QueryParams, CompletedCountRow } from './base';

export async function getFunnel(
  params: QueryParams & { courseId: string },
): Promise<AnalyticsFunnel> {
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
