import { UserModel } from '../../models/User.model';
import { ProgressModel } from '../../models/Progress.model';
import type { AnalyticsRetention, DailyPoint, StreakBucket, StreakBucketLabel } from '@senatic/shared';
import { defaultRange, fillDateGaps, type QueryParams, type DateCountRow, type StreakBucketRow, type WeeklyRow } from './base';

export async function getRetention(params: QueryParams = {}): Promise<AnalyticsRetention> {
  const { from, to } = defaultRange(params.from, params.to);

  const [dauAgg, weeklyAgg, streakAgg] = await Promise.all([
    ProgressModel.aggregate([
      { $match: { updatedAt: { $gte: from, $lte: to } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$updatedAt' } },
          count: { $addToSet: '$userId' },
        },
      },
      { $project: { _id: 1, count: { $size: '$count' } } },
      { $sort: { _id: 1 } },
    ]),
    ProgressModel.aggregate([
      { $match: { updatedAt: { $gte: from, $lte: to } } },
      {
        $group: {
          _id: {
            year: { $isoWeekYear: '$updatedAt' },
            week: { $isoWeek: '$updatedAt' },
          },
          users: { $addToSet: '$userId' },
        },
      },
      { $project: { _id: 1, count: { $size: '$users' } } },
      { $sort: { '_id.year': 1, '_id.week': 1 } },
    ]),
    UserModel.aggregate([
      {
        $bucket: {
          groupBy: '$streak',
          boundaries: [0, 1, 4, 8, 15, 31],
          default: '31+',
          output: { count: { $sum: 1 } },
        },
      },
    ]),
  ]);

  const dailyActiveUsers = fillDateGaps(
    dauAgg.map((d: DateCountRow) => ({ date: d._id, count: d.count })),
    from,
    to,
  );

  const bucketLabels: StreakBucketLabel[] = ['0', '1-3', '4-7', '8-14', '15-30', '31+'];
  const streakBuckets: StreakBucket[] = streakAgg.map((b: StreakBucketRow, i: number) => ({
    bucket: (b._id === '31+' ? '31+' : bucketLabels[i] ?? '31+') as StreakBucketLabel,
    count: b.count,
  }));

  const weeklyRetention: DailyPoint[] = weeklyAgg.map((w: WeeklyRow) => ({
    date: `${w._id.year}-W${String(w._id.week).padStart(2, '0')}`,
    count: w.count,
  }));

  return { dailyActiveUsers, weeklyRetention, streakBuckets };
}
