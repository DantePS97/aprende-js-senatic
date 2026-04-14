import mongoose, { Document, Schema } from 'mongoose';
import type { CourseLevel } from '@senatic/shared';

export interface ICourse extends Document {
  slug: string;
  title: string;
  description: string;
  level: CourseLevel;
  iconEmoji: string;
  order: number;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CourseSchema = new Schema<ICourse>(
  {
    slug: { type: String, required: true, unique: true, trim: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    level: { type: String, enum: ['basic', 'intermediate'], required: true },
    iconEmoji: { type: String, default: '📘' },
    order: { type: Number, default: 0 },
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true, versionKey: false }
);

export const CourseModel = mongoose.model<ICourse>('Course', CourseSchema);
