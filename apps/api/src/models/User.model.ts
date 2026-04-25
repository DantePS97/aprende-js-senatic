import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

// ─── Preferences sub-document ─────────────────────────────────────────────────

export interface IUserPreferences {
  theme: 'light' | 'dark' | 'system';
  accentColor: 'indigo' | 'emerald' | 'rose' | 'amber' | 'violet';
  editorTheme: 'oneDark' | 'dracula' | 'githubLight' | 'material';
  fontSize: 'normal' | 'large';
}

const UserPreferencesSchema = new Schema<IUserPreferences>(
  {
    theme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'dark',
    },
    accentColor: {
      type: String,
      enum: ['indigo', 'emerald', 'rose', 'amber', 'violet'],
      default: 'indigo',
    },
    editorTheme: {
      type: String,
      enum: ['oneDark', 'dracula', 'githubLight', 'material'],
      default: 'oneDark',
    },
    fontSize: {
      type: String,
      enum: ['normal', 'large'],
      default: 'normal',
    },
  },
  { _id: false },
);

// ─── User document ────────────────────────────────────────────────────────────

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  displayName: string;
  avatarUrl?: string;
  xp: number;
  level: number;
  streak: number;
  lastActiveDate: Date;
  isAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
  passwordResetTokenHash?: string;
  passwordResetTokenExpiresAt?: Date;
  preferences: IUserPreferences;
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
    isAdmin: {
      type: Boolean,
      default: false,
      index: true,
    },
    passwordResetTokenHash: {
      type: String,
      default: undefined,
      select: false,
      index: true, // lookup eficiente al validar/consumir el token
    },
    passwordResetTokenExpiresAt: {
      type: Date,
      default: undefined,
      select: false,
    },
    preferences: {
      type: UserPreferencesSchema,
      default: () => ({}),
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
