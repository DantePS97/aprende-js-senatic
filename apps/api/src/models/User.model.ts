import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  displayName: string;
  avatarUrl?: string;
  xp: number;
  level: number;
  streak: number;
  lastActiveDate: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false, // no se devuelve por defecto en queries
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    avatarUrl: {
      type: String,
      default: null,
    },
    xp: {
      type: Number,
      default: 0,
      min: 0,
    },
    level: {
      type: Number,
      default: 1,
      min: 1,
    },
    streak: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastActiveDate: {
      type: Date,
      default: () => new Date(),
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// ─── Métodos de instancia ─────────────────────────────────────────────────────

UserSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.passwordHash);
};

// ─── Pre-save hook ────────────────────────────────────────────────────────────

UserSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  // passwordHash ya viene como texto plano desde el controller — se hashea aquí
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
  next();
});

// Índice para consultas de ranking futuro
UserSchema.index({ xp: -1 });

export const UserModel = mongoose.model<IUser>('User', UserSchema);
