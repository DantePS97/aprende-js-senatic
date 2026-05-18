import mongoose, { Document, Schema } from 'mongoose';

export interface IChallengeAttempt extends Document {
  userId: mongoose.Types.ObjectId;
  challengeId: mongoose.Types.ObjectId;
  code: string;
  passed: boolean;
  testsPassedCount: number;
  totalTests: number;
  submittedAt: Date;
}

const ChallengeAttemptSchema = new Schema<IChallengeAttempt>(
  {
    userId:           { type: Schema.Types.ObjectId, ref: 'User', required: true },
    challengeId:      { type: Schema.Types.ObjectId, ref: 'Challenge', required: true },
    code:             { type: String, required: true },
    passed:           { type: Boolean, required: true },
    testsPassedCount: { type: Number, required: true, min: 0 },
    totalTests:       { type: Number, required: true, min: 1 },
    submittedAt:      { type: Date, default: () => new Date() },
  },
  { versionKey: false }
);

ChallengeAttemptSchema.index({ userId: 1, challengeId: 1 });
ChallengeAttemptSchema.index({ challengeId: 1, passed: 1 });
ChallengeAttemptSchema.index({ submittedAt: -1 });

export const ChallengeAttemptModel = mongoose.model<IChallengeAttempt>(
  'ChallengeAttempt',
  ChallengeAttemptSchema
);
