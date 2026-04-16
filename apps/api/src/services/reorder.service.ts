import mongoose, { Model, Document } from 'mongoose';

export interface ReorderResult<T> {
  moved: T;
  swapped: T;
}

/**
 * Generic reorder service using Mongo transactions.
 *
 * Finds the current document by `id` (must also match `scopeFilter`), then
 * finds the adjacent sibling in the given direction. Swaps their `order`
 * values atomically inside a Mongoose transaction.
 *
 * Returns null when the entity is already at the boundary (no sibling in
 * that direction). Throws `{ status: 404, code: 'NOT_FOUND' }` when the
 * entity itself cannot be located.
 */
export async function reorderEntity<T extends Document & { order: number }>(
  Model: Model<T>,
  id: string,
  direction: 'up' | 'down',
  scopeFilter: Record<string, unknown> = {}
): Promise<ReorderResult<T> | null> {
  const current = await Model.findOne({
    _id: id,
    ...scopeFilter,
  });

  if (!current) {
    throw { status: 404, code: 'NOT_FOUND' };
  }

  const siblingOrder = direction === 'down' ? current.order + 1 : current.order - 1;

  const sibling = await Model.findOne({
    order: siblingOrder,
    ...scopeFilter,
  });

  // Already at boundary — caller decides how to handle this.
  if (!sibling) {
    return null;
  }

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const tmp = current.order;
      current.order = sibling.order;
      sibling.order = tmp;
      await current.save({ session });
      await sibling.save({ session });
    });
  } finally {
    session.endSession();
  }

  return { moved: current, swapped: sibling };
}
