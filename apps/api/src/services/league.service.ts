import mongoose from 'mongoose';
import { ProgressModel } from '../models/Progress.model';
import { UserModel } from '../models/User.model';
import { WeeklyLeagueResultModel } from '../models/WeeklyLeagueResult.model';
import { getWeekBounds } from '../lib/week-bounds';
import type { Tier, UserLeagueStatus, WeeklyLeagueEntry, WeeklyLeagueResponse } from '@senatic/shared';

// ─── Tier thresholds ──────────────────────────────────────────────────────────

export const TIER_THRESHOLDS = { gold: 700, silver: 300, bronze: 1 } as const;

export function getTierForXp(xp: number): Tier | null {
  if (xp >= TIER_THRESHOLDS.gold)   return 'gold';
  if (xp >= TIER_THRESHOLDS.silver) return 'silver';
  if (xp >= TIER_THRESHOLDS.bronze) return 'bronze';
  return null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

async function aggregateWeekXp(
  start: Date,
  end: Date
): Promise<{ userId: string; weeklyXp: number }[]> {
  const rows = await ProgressModel.aggregate([
    { $match: { status: 'completed', completedAt: { $gte: start, $lt: end } } },
    { $group: { _id: '$userId', weeklyXp: { $sum: '$xpEarned' } } },
  ]);
  return rows.map((r) => ({ userId: (r._id as mongoose.Types.ObjectId).toString(), weeklyXp: r.weeklyXp as number }));
}

function rankEntries<T extends { weeklyXp: number }>(entries: T[]): (T & { rank: number })[] {
  return [...entries]
    .sort((a, b) => b.weeklyXp - a.weeklyXp)
    .map((e, i) => ({ ...e, rank: i + 1 }));
}

// ─── getCurrentWeekStatus ─────────────────────────────────────────────────────

export async function getCurrentWeekStatus(userId: string): Promise<UserLeagueStatus> {
  const { start, end } = getWeekBounds();

  const rows = await ProgressModel.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        status: 'completed',
        completedAt: { $gte: start, $lt: end },
      },
    },
    { $group: { _id: null, weeklyXp: { $sum: '$xpEarned' } } },
  ]);

  const weeklyXp: number = rows[0]?.weeklyXp ?? 0;
  return {
    tier: getTierForXp(weeklyXp),
    weeklyXp,
    weekStart: fmtDate(start),
  };
}

// ─── getWeeklyLeague ──────────────────────────────────────────────────────────

export async function getWeeklyLeague(): Promise<WeeklyLeagueResponse> {
  const { start, end } = getWeekBounds();
  const weekEnd = fmtDate(new Date(end.getTime() - 86_400_000));

  const xpRows = await aggregateWeekXp(start, end);
  if (xpRows.length === 0) {
    return { weekStart: fmtDate(start), weekEnd, gold: [], silver: [], bronze: [] };
  }

  const userIds = xpRows.map((r) => r.userId);
  const users = await UserModel.find({ _id: { $in: userIds } }).select('displayName avatarUrl level');
  const userMap = new Map(users.map((u) => [u._id.toString(), u]));

  const byTier: Record<Tier, typeof xpRows> = { gold: [], silver: [], bronze: [] };
  for (const row of xpRows) {
    const tier = getTierForXp(row.weeklyXp);
    if (tier) byTier[tier].push(row);
  }

  function buildEntries(rows: typeof xpRows): WeeklyLeagueEntry[] {
    const withUser = rows
      .map((r) => {
        const u = userMap.get(r.userId);
        if (!u) return null;
        return {
          userId: r.userId,
          displayName: u.displayName,
          avatarUrl: u.avatarUrl ?? null,
          level: u.level,
          weeklyXp: r.weeklyXp,
          rank: 0,
        };
      })
      .filter((e): e is NonNullable<typeof e> => e !== null);
    return rankEntries(withUser).slice(0, 20);
  }

  return {
    weekStart: fmtDate(start),
    weekEnd,
    gold:   buildEntries(byTier.gold),
    silver: buildEntries(byTier.silver),
    bronze: buildEntries(byTier.bronze),
  };
}

// ─── getUserLeagueHistory ─────────────────────────────────────────────────────

export async function getUserLeagueHistory(userId: string) {
  return WeeklyLeagueResultModel
    .find({ userId: new mongoose.Types.ObjectId(userId) })
    .sort({ weekStart: -1 })
    .limit(8)
    .lean();
}

// ─── snapshotWeek ─────────────────────────────────────────────────────────────

export async function snapshotWeek(weekStart: Date): Promise<void> {
  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekStart.getUTCDate() + 7);

  const xpRows = await aggregateWeekXp(weekStart, weekEnd);
  const eligible = xpRows.filter((r) => r.weeklyXp >= 1);
  if (eligible.length === 0) return;

  const byTier: Record<Tier, typeof eligible> = { gold: [], silver: [], bronze: [] };
  for (const row of eligible) {
    const tier = getTierForXp(row.weeklyXp);
    if (tier) byTier[tier].push(row);
  }

  const operations: Parameters<typeof WeeklyLeagueResultModel.bulkWrite>[0] = [];
  for (const tier of ['gold', 'silver', 'bronze'] as Tier[]) {
    const ranked = rankEntries(byTier[tier]);
    for (const entry of ranked) {
      operations.push({
        updateOne: {
          filter: { userId: new mongoose.Types.ObjectId(entry.userId), weekStart },
          update: { $set: { tier, weeklyXp: entry.weeklyXp, rank: entry.rank } },
          upsert: true,
        },
      });
    }
  }

  if (operations.length > 0) {
    await WeeklyLeagueResultModel.bulkWrite(operations);
  }
}
