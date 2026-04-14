import mongoose, { Document, Schema } from 'mongoose';

// ─── Forum Post ───────────────────────────────────────────────────────────────

export interface IForumPost extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  body: string;
  tags: string[];
  upvotes: number;
  upvotedBy: mongoose.Types.ObjectId[];
  replyCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const ForumPostSchema = new Schema<IForumPost>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    body: { type: String, required: true, maxlength: 5000 },
    tags: [{ type: String, trim: true, maxlength: 30 }],
    upvotes: { type: Number, default: 0 },
    upvotedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    replyCount: { type: Number, default: 0 },
  },
  { timestamps: true, versionKey: false }
);

ForumPostSchema.index({ createdAt: -1 });
ForumPostSchema.index({ tags: 1 });

export const ForumPostModel = mongoose.model<IForumPost>('ForumPost', ForumPostSchema);

// ─── Forum Reply ──────────────────────────────────────────────────────────────

export interface IForumReply extends Document {
  postId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  body: string;
  upvotes: number;
  upvotedBy: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const ForumReplySchema = new Schema<IForumReply>(
  {
    postId: { type: Schema.Types.ObjectId, ref: 'ForumPost', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    body: { type: String, required: true, maxlength: 3000 },
    upvotes: { type: Number, default: 0 },
    upvotedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true, versionKey: false }
);

ForumReplySchema.index({ postId: 1, createdAt: 1 });

export const ForumReplyModel = mongoose.model<IForumReply>('ForumReply', ForumReplySchema);
