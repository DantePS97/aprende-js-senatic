import mongoose, { Document, Schema } from 'mongoose';

// ─── Push Subscription document ───────────────────────────────────────────────

export interface IPushSubscription extends Document {
  userId: mongoose.Types.ObjectId;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  userAgent?: string;
  lastSuccessAt?: Date;
  failureCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const PushSubscriptionSchema = new Schema<IPushSubscription>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    endpoint: {
      type: String,
      required: true,
      unique: true,
    },
    keys: {
      p256dh: { type: String, required: true },
      auth: { type: String, required: true },
    },
    userAgent: {
      type: String,
      maxlength: 512,
      default: undefined,
    },
    lastSuccessAt: {
      type: Date,
      default: undefined,
    },
    failureCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

PushSubscriptionSchema.index({ userId: 1 });

export const PushSubscription = mongoose.model<IPushSubscription>(
  'PushSubscription',
  PushSubscriptionSchema
);
