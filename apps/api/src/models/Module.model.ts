import mongoose, { Document, Schema } from 'mongoose';

export interface IModule extends Document {
  courseId: mongoose.Types.ObjectId;
  order: number;
  title: string;
  description: string;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ModuleSchema = new Schema<IModule>(
  {
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    order: { type: Number, required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true, versionKey: false }
);

ModuleSchema.index({ courseId: 1, order: 1 });

export const ModuleModel = mongoose.model<IModule>('Module', ModuleSchema);
