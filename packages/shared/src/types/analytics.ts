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
