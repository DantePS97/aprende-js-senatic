import mongoose, { Document, Schema } from 'mongoose';
import type { ChallengeProgressStatus } from '@senatic/shared';

export interface IChallengeProgress extends Document {
  userId: mongoose.Types.ObjectId;
  challengeId: mongoose.Types.ObjectId;
  status: ChallengeProgressStatus;
  firstSolvedAt: Date | null;
  xpAwarded: number;
  createdAt: Date;
  updatedAt: Date;
}

const ChallengeProgressSchema = new Schema<IChallengeProgress>(
  {
    userId:        { type: Schema.Types.ObjectId, ref: 'User', required: true },
    challengeId:   { type: Schema.Types.ObjectId, ref: 'Challenge', required: true },
    status:        { type: String, enum: ['unsolved', 'solved'], default: 'unsolved' },
    firstSolvedAt: { type: Date, default: null },
    xpAwarded:     { type: Number, default: 0, min: 0 },
  },
  { timestamps: true, versionKey: false }
);

ChallengeProgressSchema.index({ userId: 1, challengeId: 1 }, { unique: true });
ChallengeProgressSchema.index({ userId: 1, status: 1 });
ChallengeProgressSchema.index({ challengeId: 1, status: 1 });

export const ChallengeProgressModel = mongoose.model<IChallengeProgress>(
  'ChallengeProgress',
  ChallengeProgressSchema
);
