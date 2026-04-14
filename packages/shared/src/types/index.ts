// ─── Enums ────────────────────────────────────────────────────────────────────

export type CourseLevel = 'basic' | 'intermediate';

export type LessonStatus = 'not_started' | 'in_progress' | 'completed';

export type AchievementConditionType =
  | 'lessons_completed'
  | 'streak'
  | 'xp'
  | 'module_completed'
  | 'no_hints';

// ─── User ─────────────────────────────────────────────────────────────────────

export interface User {
  _id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  xp: number;
  level: number;
  streak: number;
  lastActiveDate: string; // ISO date string
  createdAt: string;
  updatedAt: string;
}

export interface UserPublic {
  _id: string;
  displayName: string;
  avatarUrl?: string;
  xp: number;
  level: number;
  streak: number;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

// ─── Course ───────────────────────────────────────────────────────────────────

export interface Course {
  _id: string;
  slug: string;
  title: string;
  description: string;
  level: CourseLevel;
  iconEmoji: string;
  totalLessons: number;
  modules: Module[];
}

export interface Module {
  _id: string;
  courseId: string;
  order: number;
  title: string;
  description: string;
  lessons: LessonSummary[];
}

export interface LessonSummary {
  _id: string;
  moduleId: string;
  order: number;
  title: string;
  xpReward: number;
}

// ─── Lesson Content (from JSON files) ─────────────────────────────────────────

export interface LessonExample {
  code: string;
  explanation: string;
}

export interface LessonTest {
  description: string;
  expression: string; // JS expression evaluated in sandbox context
}

export interface LessonExercise {
  prompt: string;
  starterCode: string;
  tests: LessonTest[];
  hints: string[];
}

export interface LessonTheory {
  markdown: string;
  examples: LessonExample[];
}

export interface LessonContent {
  id: string;
  title: string;
  xpReward: number;
  theory: LessonTheory;
  exercise: LessonExercise;
}

// ─── Progress ─────────────────────────────────────────────────────────────────

export interface Progress {
  _id: string;
  userId: string;
  lessonId: string;
  status: LessonStatus;
  xpEarned: number;
  attempts: number;
  hintsUsed: number;
  completedAt?: string;
  syncedAt?: string;
}

export interface ProgressStats {
  totalXp: number;
  level: number;
  streak: number;
  completedLessons: number;
  totalLessons: number;
  percentageComplete: number;
  lastActiveDate: string;
}

export interface SubmitProgressRequest {
  lessonId: string;
  passed: boolean;
  hintsUsed: number;
  completedAt: string; // ISO — used for offline conflict resolution
}

export interface SubmitProgressResponse {
  progress: Progress;
  xpEarned: number;
  leveledUp: boolean;
  newLevel?: number;
  newAchievements: Achievement[];
}

// ─── Achievements ─────────────────────────────────────────────────────────────

export interface AchievementCondition {
  type: AchievementConditionType;
  threshold: number;
  lessonId?: string;
  moduleId?: string;
}

export interface Achievement {
  _id: string;
  key: string;
  title: string;
  description: string;
  iconEmoji: string;
  condition: AchievementCondition;
}

export interface UserAchievement {
  achievement: Achievement;
  earnedAt: string;
}

// ─── Forum ────────────────────────────────────────────────────────────────────

export interface ForumPost {
  _id: string;
  author: UserPublic;
  title: string;
  body: string;
  tags: string[];
  upvotes: number;
  replyCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ForumReply {
  _id: string;
  postId: string;
  author: UserPublic;
  body: string;
  upvotes: number;
  createdAt: string;
}

// ─── Sync (offline) ───────────────────────────────────────────────────────────

export interface SyncEvent {
  lessonId: string;
  passed: boolean;
  hintsUsed: number;
  completedAt: string; // ISO — timestamp for conflict resolution
  localId: string;     // IndexedDB local ID for ack
}

export interface SyncRequest {
  events: SyncEvent[];
}

export interface SyncResponse {
  acknowledged: string[]; // localIds successfully processed
  progress: Progress[];   // canonical server state
  newAchievements: Achievement[];
  xpTotal: number;
  level: number;
}

// ─── API Response wrappers ────────────────────────────────────────────────────

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: string;
  code?: string;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;
