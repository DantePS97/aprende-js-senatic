import mongoose, { Document, Schema } from 'mongoose';

export interface ILessonExample {
  code: string;
  explanation: string;
}

export interface ILessonExercise {
  title: string;
  prompt: string;
  startCode: string; // NOTE: admin uses startCode; runtime contract uses starterCode — normalize on read
  tests: string;     // raw JS source as a single string — admin edits textually
  hints: string[];   // 0..10
}

export interface ILessonContent extends Document {
  lessonId: mongoose.Types.ObjectId;
  theory: {
    markdown: string;
    examples: ILessonExample[];
  };
  exercises: ILessonExercise[];
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

const ExampleSchema = new Schema<ILessonExample>(
  {
    code: { type: String, required: true },
    explanation: { type: String, default: '' },
  },
  { _id: false }
);

const ExerciseSchema = new Schema<ILessonExercise>(
  {
    title: { type: String, default: '' },
    prompt: { type: String, default: '' },
    startCode: { type: String, required: true },
    tests: { type: String, required: true },
    hints: {
      type: [String],
      default: [],
      validate: {
        validator: (v: string[]) => v.length <= 10,
        message: 'Max 10 hints per exercise.',
      },
    },
  },
  { _id: false }
);

const LessonContentSchema = new Schema<ILessonContent>(
  {
    lessonId: {
      type: Schema.Types.ObjectId,
      ref: 'Lesson',
      required: true,
      unique: true, // 1:1 with Lesson — REQ-052
      index: true,
    },
    theory: {
      markdown: { type: String, default: '', maxlength: 50000 }, // REQ-068
      examples: {
        type: [ExampleSchema],
        default: [],
        validate: {
          validator: (v: ILessonExample[]) => v.length <= 20,
          message: 'Max 20 examples per lesson.', // REQ-069
        },
      },
    },
    exercises: {
      type: [ExerciseSchema],
      default: [],
      validate: {
        validator: (v: ILessonExercise[]) => v.length <= 30,
        message: 'Max 30 exercises per lesson.', // REQ-070
      },
    },
    version: { type: Number, default: 1, min: 1 },
  },
  { timestamps: true, versionKey: false }
);

// Pre-save: bump version on any modification of theory or exercises
LessonContentSchema.pre('save', function (next) {
  if (!this.isNew && (this.isModified('theory') || this.isModified('exercises'))) {
    this.version = (this.version ?? 1) + 1;
  }
  next();
});

export const LessonContentModel =
  mongoose.models['LessonContent'] ??
  mongoose.model<ILessonContent>('LessonContent', LessonContentSchema);
