import { Types } from 'mongoose';
import { AdminAuditModel, IAdminAudit } from '../models/AdminAudit.model';

/**
 * Fire-and-forget audit write — never throws, never blocks the response.
 * Callers must NOT await the return value:
 *   writeAudit({...}).catch(() => {}) // already caught internally
 */
export async function writeAudit(params: {
  adminId: string | Types.ObjectId;
  action: IAdminAudit['action'];
  entityType: IAdminAudit['entityType'];
  entityId: string | Types.ObjectId;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    await AdminAuditModel.create({
      adminId: params.adminId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      metadata: params.metadata ?? null,
      timestamp: new Date(),
    });
  } catch (err) {
    // Audit failures must never surface to the user — log only.
    console.error('[audit.service] writeAudit failed:', err);
  }
}
