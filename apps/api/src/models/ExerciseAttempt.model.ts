import mongoose, { Document, Schema } from 'mongoose';

export interface IExerciseAttempt extends Document {
  userId: mongoose.Types.ObjectId;
  lessonId: mongoose.Types.ObjectId;
  exerciseIndex: number;
  exerciseTitle: string;
  attempts: number;
  passed: boolean;
  hintsUsed: number;
  firstAttemptAt: Date;
  lastAttemptAt: Date;
}

const ExerciseAttemptSchema = new Schema<IExerciseAttempt>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    lessonId: { type: Schema.Types.ObjectId, ref: 'Lesson', required: true },
    exerciseIndex: { type: Number, required: true, min: 0 },
    exerciseTitle: { type: String, default: '' },
    attempts: { type: Number, default: 0, min: 0 },
    passed: { type: Boolean, default: false },
    hintsUsed: { type: Number, default: 0, min: 0 },
    firstAttemptAt: { type: Date, default: () => new Date() },
    lastAttemptAt: { type: Date, default: () => new Date() },
  },
  { versionKey: false },
);

// Un registro por usuario × lección × ejercicio
ExerciseAttemptSchema.index({ userId: 1, lessonId: 1, exerciseIndex: 1 }, { unique: true });
// Para analytics por lección
ExerciseAttemptSchema.index({ lessonId: 1, exerciseIndex: 1 });

export const ExerciseAttemptModel = mongoose.model<IExerciseAttempt>(
  'ExerciseAttempt',
  ExerciseAttemptSchema,
);
