export interface DailyPoint {
  date: string;
  count: number;
}

export interface DateRangeParams {
  from?: string;
  to?: string;
  courseId?: string;
}

export interface AnalyticsOverview {
  totalUsers: number;
  activeUsers: number;
  totalLessonsCompleted: number;
  avgCompletionRate: number;
  levelDistribution: Record<string, number>;
  dailyCompletions: DailyPoint[];
}

export interface AnalyticsLesson {
  lessonId: string;
  title: string;
  courseId: string;
  courseTitle: string;
  totalAttempts: number;
  completions: number;
  completionRate: number;
  avgTimeSeconds: number;
}

export interface AnalyticsLessonsResponse {
  lessons: AnalyticsLesson[];
  total: number;
}

export type StreakBucketLabel = '0' | '1-3' | '4-7' | '8-14' | '15-30' | '31+';

export interface StreakBucket {
  bucket: StreakBucketLabel;
  count: number;
}

export interface AnalyticsRetention {
  dailyActiveUsers: DailyPoint[];
  weeklyRetention: DailyPoint[];
  streakBuckets: StreakBucket[];
}

export interface FunnelStage {
  stage: string;
  count: number;
  dropoffRate: number;
}

export interface AnalyticsFunnel {
  courseId: string;
  courseTitle: string;
  stages: FunnelStage[];
}

// ─── Student profile ──────────────────────────────────────────────────────────

export interface StudentSummary {
  id: string;
  displayName: string;
  email: string;
  xp: number;
  level: number;
  streak: number;
  completedLessons: number;
  lastActiveDate: string | null;
}

export interface StudentsListResponse {
  students: StudentSummary[];
  total: number;
}

export interface StudentLessonProgress {
  lessonId: string;
  lessonTitle: string;
  moduleTitle: string;
  status: 'not_started' | 'in_progress' | 'completed';
  xpEarned: number;
  attempts: number;
  hintsUsed: number;
  completedAt: string | null;
}

export interface StudentProfile {
  id: string;
  displayName: string;
  email: string;
  xp: number;
  level: number;
  streak: number;
  lastActiveDate: string | null;
  completedLessons: number;
  totalLessons: number;
  dailyActivity: DailyPoint[];
  progress: StudentLessonProgress[];
}
