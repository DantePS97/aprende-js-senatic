import cron from 'node-cron';
import { snapshotWeek } from '../services/league.service';
import { getWeekBounds } from './week-bounds';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns the Monday 00:00 UTC of the ISO week BEFORE the current week. */
function getPreviousWeekStart(): Date {
  const { start } = getWeekBounds();
  const prev = new Date(start);
  prev.setUTCDate(start.getUTCDate() - 7);
  return prev;
}

// ─── Boot catch-up ────────────────────────────────────────────────────────────

/**
 * Snapshots the previous ISO week if it hasn't been snapshotted yet.
 * Non-fatal: server boots successfully even if this fails.
 */
export async function runLeagueCatchup(): Promise<void> {
  try {
    const prevWeekStart = getPreviousWeekStart();
    await snapshotWeek(prevWeekStart);
    console.log('[leagues] catch-up snapshot done for', prevWeekStart.toISOString().slice(0, 10));
  } catch (err) {
    console.error('[leagues] catch-up snapshot failed (non-fatal):', err);
  }
}

// ─── Cron job ─────────────────────────────────────────────────────────────────

/**
 * Schedules a cron job that fires every Monday at 00:01 UTC.
 * Snapshots the week that just ended (previous week from the new week's perspective).
 */
export function setupLeagueCron(): void {
  cron.schedule(
    '1 0 * * 1', // Monday 00:01 UTC
    async () => {
      try {
        const prevWeekStart = getPreviousWeekStart();
        await snapshotWeek(prevWeekStart);
        console.log('[leagues] cron snapshot done for', prevWeekStart.toISOString().slice(0, 10));
      } catch (err) {
        console.error('[leagues] cron snapshot failed:', err);
      }
    },
    { timezone: 'UTC' }
  );
  console.log('[leagues] cron scheduled — Mon 00:01 UTC');
}
