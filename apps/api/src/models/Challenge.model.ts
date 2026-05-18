import mongoose, { Document, Schema } from 'mongoose';
import type { Difficulty } from '@senatic/shared';

export interface ITestCase {
  input: string;
  expectedOutput: string;
  hidden: boolean;
  description?: string;
}

export interface IChallenge extends Document {
  slug: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  xpReward: number;
  starterCode: string;
  testCases: ITestCase[];
  order: number;
  published: boolean;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const TestCaseSchema = new Schema<ITestCase>(
  {
    input:          { type: String, required: true },
    expectedOutput: { type: String, required: true },
    hidden:         { type: Boolean, default: false },
    description:    { type: String, default: null },
  },
  { _id: false }
);

const ChallengeSchema = new Schema<IChallenge>(
  {
    slug:        { type: String, required: true, unique: true, trim: true, lowercase: true },
    title:       { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, required: true },
    difficulty:  { type: String, enum: ['facil', 'medio', 'dificil'], required: true },
    xpReward:    { type: Number, required: true, min: 1, max: 500 },
    starterCode: { type: String, required: true },
    testCases:   {
      type: [TestCaseSchema],
      required: true,
      validate: {
        validator: (v: ITestCase[]) => v.length >= 1 && v.length <= 20,
        message: 'Must have 1–20 test cases',
      },
    },
    order:       { type: Number, required: true, min: 1 },
    published:   { type: Boolean, default: false, index: true },
    tags:        { type: [String], default: [] },
  },
  { timestamps: true, versionKey: false }
);

ChallengeSchema.index({ order: 1, published: 1 });
ChallengeSchema.index({ difficulty: 1, published: 1 });
ChallengeSchema.index({ tags: 1 });

export const ChallengeModel = mongoose.model<IChallenge>('Challenge', ChallengeSchema);
