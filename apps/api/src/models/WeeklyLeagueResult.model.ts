import mongoose, { Document, Schema } from 'mongoose';
import type { Tier } from '@senatic/shared';

export interface IWeeklyLeagueResult extends Document {
  userId: mongoose.Types.ObjectId;
  weekStart: Date; // Monday 00:00:00 UTC
  tier: Tier;
  weeklyXp: number; // min: 1
  rank: number;     // rank within the tier for this week
  createdAt: Date;
  updatedAt: Date;
}

const WeeklyLeagueResultSchema = new Schema<IWeeklyLeagueResult>(
  {
    userId:    { type: Schema.Types.ObjectId, ref: 'User', required: true },
    weekStart: { type: Date, required: true },
    tier:      { type: String, enum: ['gold', 'silver', 'bronze'], required: true },
    weeklyXp:  { type: Number, required: true, min: 1 },
    rank:      { type: Number, required: true },
  },
  { timestamps: true, versionKey: false }
);

// Idempotency — one result per user per week
WeeklyLeagueResultSchema.index({ userId: 1, weekStart: 1 }, { unique: true });
// Leaderboard queries per week+tier
WeeklyLeagueResultSchema.index({ weekStart: 1, tier: 1 });
// History queries per user, newest first
WeeklyLeagueResultSchema.index({ userId: 1, weekStart: -1 });

export const WeeklyLeagueResultModel = mongoose.model<IWeeklyLeagueResult>(
  'WeeklyLeagueResult',
  WeeklyLeagueResultSchema
);
