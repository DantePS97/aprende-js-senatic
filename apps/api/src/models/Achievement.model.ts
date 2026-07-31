import mongoose, { Document, Schema } from 'mongoose';
import type { AchievementConditionType } from '@senatic/shared';

// ─── Achievement definition ───────────────────────────────────────────────────

export interface IAchievement extends Document {
  key: string;
  title: string;
  description: string;
  iconEmoji: string;
  condition: {
    type: AchievementConditionType;
    threshold: number;
    lessonId?: string;
    moduleId?: string;
    difficulty?: string;
  };
  createdAt: Date;
}

const AchievementSchema = new Schema<IAchievement>(
  {
    key: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    iconEmoji: { type: String, default: '🏆' },
    condition: {
      type: {
        type: String,
        enum: [
          'lessons_completed', 'streak', 'xp', 'module_completed', 'module_completed_specific',
          'no_hints', 'lessons_in_day', 'challenges_solved', 'challenges_solved_difficulty',
        ],
        required: true,
      },
      threshold: { type: Number, required: true },
      lessonId:  { type: String, default: null },
      moduleId:  { type: String, default: null },
      difficulty:{ type: String, default: null },
    },
  },
  { timestamps: { createdAt: true, updatedAt: false }, versionKey: false }
);

export const AchievementModel = mongoose.model<IAchievement>('Achievement', AchievementSchema);

// ─── User Achievement (earned) ────────────────────────────────────────────────

export interface IUserAchievement extends Document {
  userId: mongoose.Types.ObjectId;
  achievementId: mongoose.Types.ObjectId;
  earnedAt: Date;
  emailSentAt?: Date;
  source: 'auto' | 'manual';
  grantedBy?: mongoose.Types.ObjectId;
}

const UserAchievementSchema = new Schema<IUserAchievement>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    achievementId: { type: Schema.Types.ObjectId, ref: 'Achievement', required: true },
    earnedAt: { type: Date, default: () => new Date() },
    emailSentAt: { type: Date, default: null },
    source: { type: String, enum: ['auto', 'manual'], default: 'auto' },
    grantedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { versionKey: false }
);

UserAchievementSchema.index({ userId: 1, achievementId: 1 }, { unique: true });

export const UserAchievementModel = mongoose.model<IUserAchievement>(
  'UserAchievement',
  UserAchievementSchema
);
