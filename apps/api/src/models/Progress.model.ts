import mongoose, { Document, Schema } from 'mongoose';
import type { LessonStatus } from '@senatic/shared';

export interface IProgress extends Document {
  userId: mongoose.Types.ObjectId;
  lessonId: mongoose.Types.ObjectId;
  status: LessonStatus;
  xpEarned: number;
  attempts: number;
  hintsUsed: number;
  completedAt?: Date;
  syncedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ProgressSchema = new Schema<IProgress>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    lessonId: { type: Schema.Types.ObjectId, ref: 'Lesson', required: true },
    status: {
      type: String,
      enum: ['not_started', 'in_progress', 'completed'],
      default: 'not_started',
    },
    xpEarned: { type: Number, default: 0 },
    attempts: { type: Number, default: 0 },
    hintsUsed: { type: Number, default: 0 },
    completedAt: { type: Date, default: null },
    syncedAt: { type: Date, default: null },
  },
  { timestamps: true, versionKey: false }
);

// Índice compuesto — garantiza un único registro por usuario+lección
ProgressSchema.index({ userId: 1, lessonId: 1 }, { unique: true });
// Para calcular stats rápido
ProgressSchema.index({ userId: 1, status: 1 });
// Para analytics — queries por fecha y por lección
ProgressSchema.index({ completedAt: 1 });
ProgressSchema.index({ lessonId: 1, status: 1 });
ProgressSchema.index({ updatedAt: 1 });

export const ProgressModel = mongoose.model<IProgress>('Progress', ProgressSchema);
