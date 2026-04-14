import mongoose, { Document, Schema } from 'mongoose';

export interface ILesson extends Document {
  moduleId: mongoose.Types.ObjectId;
  order: number;
  title: string;
  xpReward: number;
  contentId: string; // ID que referencia el JSON en /content/
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
    contentId: { type: String, required: true }, // ej: "js-basico-m1-l1"
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true, versionKey: false }
);

LessonSchema.index({ moduleId: 1, order: 1 });

export const LessonModel = mongoose.model<ILesson>('Lesson', LessonSchema);
