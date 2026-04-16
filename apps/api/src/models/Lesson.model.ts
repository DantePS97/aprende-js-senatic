import mongoose, { Document, Schema } from 'mongoose';

export interface ILesson extends Document {
  moduleId: mongoose.Types.ObjectId;
  order: number;
  title: string;
  xpReward: number;
  /**
   * @deprecated — use LessonContent collection; kept for dual-read fallback
   * during the transition window. New code MUST NOT write to this field.
   */
  contentId?: string | null;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const LessonSchema = new Schema<ILesson>(
  {
    moduleId: { type: Schema.Types.ObjectId, ref: 'Module', required: true },
    order: { type: Number, required: true },
    title: { type: String, required: true, trim: true },
    xpReward: { type: Number, default: 15, min: 1 },
    // @deprecated — use LessonContent collection; kept for dual-read fallback
    contentId: { type: String, required: false, default: null }, // ej: "js-basico-m1-l1"
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true, versionKey: false }
);

LessonSchema.index({ moduleId: 1, order: 1 });

export const LessonModel = mongoose.model<ILesson>('Lesson', LessonSchema);
