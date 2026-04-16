import mongoose, { Document, Schema } from 'mongoose';

export type AdminAuditAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'reorder'
  | 'publish'
  | 'unpublish'
  | 'promote'
  | 'demote';

export type AdminAuditEntityType =
  | 'course'
  | 'module'
  | 'lesson'
  | 'lessonContent'
  | 'user';

export interface IAdminAudit extends Document {
  adminId: mongoose.Types.ObjectId;
  action: AdminAuditAction;
  entityType: AdminAuditEntityType;
  entityId: mongoose.Types.ObjectId;
  metadata?: Record<string, unknown>;
  timestamp: Date;
}

const AdminAuditSchema = new Schema<IAdminAudit>(
  {
    adminId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      enum: ['create', 'update', 'delete', 'reorder', 'publish', 'unpublish', 'promote', 'demote'],
    },
    entityType: {
      type: String,
      required: true,
      enum: ['course', 'module', 'lesson', 'lessonContent', 'user'],
      index: true,
    },
    entityId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    metadata: { type: Schema.Types.Mixed, default: null },
    timestamp: { type: Date, default: () => new Date(), index: true },
  },
  { versionKey: false }
);

// Compound index for audit list page filter combos — REQ-097
AdminAuditSchema.index({ entityType: 1, timestamp: -1 });
AdminAuditSchema.index({ adminId: 1, timestamp: -1 });

// TTL index: auto-delete after 365 days — NFR-AUDIT-03
AdminAuditSchema.index({ timestamp: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 });

export const AdminAuditModel =
  mongoose.models['AdminAudit'] ??
  mongoose.model<IAdminAudit>('AdminAudit', AdminAuditSchema);
