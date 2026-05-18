import { CourseModel } from '../models/Course.model';
import { ModuleModel } from '../models/Module.model';
import { LessonModel } from '../models/Lesson.model';
import { ProgressModel } from '../models/Progress.model';
import type { UnlockStatus } from '@senatic/shared';

const REQUIRED_COURSE_SLUG = 'javascript-basico';

export async function computeUnlockStatus(userId: string): Promise<UnlockStatus> {
  const course = await CourseModel.findOne({ slug: REQUIRED_COURSE_SLUG });
  if (!course) {
    return {
      unlocked: false,
      requiredCourseSlug: REQUIRED_COURSE_SLUG,
      completedLessons: 0,
      totalLessons: 0,
      progressPercent: 0,
    };
  }

  const modules = await ModuleModel.find({ courseId: course._id }).select('_id');
  const moduleIds = modules.map((m) => m._id);
  const lessons = await LessonModel.find(
    { moduleId: { $in: moduleIds }, isPublished: true }
  ).select('_id');
  const lessonIds = lessons.map((l) => l._id);
  const totalLessons = lessonIds.length;

  if (totalLessons === 0) {
    return {
      unlocked: false,
      requiredCourseSlug: REQUIRED_COURSE_SLUG,
      completedLessons: 0,
      totalLessons: 0,
      progressPercent: 0,
    };
  }

  const completedLessons = await ProgressModel.countDocuments({
    userId,
    lessonId: { $in: lessonIds },
    status: 'completed',
  });

  const unlocked = completedLessons === totalLessons;
  const progressPercent = Math.round((completedLessons / totalLessons) * 100);

  return {
    unlocked,
    requiredCourseSlug: REQUIRED_COURSE_SLUG,
    completedLessons,
    totalLessons,
    progressPercent,
  };
}
