import { UserModel } from '../../models/User.model';
import { ProgressModel } from '../../models/Progress.model';
import type { AnalyticsOverview, DailyPoint } from '@senatic/shared';
import { defaultRange, fillDateGaps, type QueryParams, type DateCountRow } from './base';

export async function getOverview(params: QueryParams = {}): Promise<AnalyticsOverview> {
  const { from, to } = defaultRange(params.from, params.to);
  const dateFilter = { completedAt: { $gte: from, $lte: to } };

  const [
    totalUsers,
    totalLessonsCompleted,
    activeUserIds,
    levelAgg,
    dailyAgg,
    completionRateAgg,
  ] = await Promise.all([
    UserModel.countDocuments(),
    ProgressModel.countDocuments({ status: 'completed', ...dateFilter }),
    ProgressModel.distinct('userId', { status: 'completed', ...dateFilter }),
    UserModel.aggregate([
      { $group: { _id: '$level', count: { $sum: 1 } } },
    ]),
    ProgressModel.aggregate([
      { $match: { status: 'completed', ...dateFilter } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$completedAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    ProgressModel.aggregate([
      {
        $group: {
          _id: '$lessonId',
          total: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        },
      },
      {
        $project: {
          rate: { $cond: [{ $gt: ['$total', 0] }, { $divide: ['$completed', '$total'] }, 0] },
        },
      },
      { $group: { _id: null, avg: { $avg: '$rate' } } },
    ]),
  ]);

  const levelDistribution: Record<string, number> = {};
  for (const l of levelAgg) levelDistribution[String(l._id)] = l.count;

  const rawPoints: DailyPoint[] = dailyAgg.map((d: DateCountRow) => ({ date: d._id, count: d.count }));
  const dailyCompletions = fillDateGaps(rawPoints, from, to);

  return {
    totalUsers,
    activeUsers: activeUserIds.length,
    totalLessonsCompleted,
    avgCompletionRate: completionRateAgg[0]?.avg ?? 0,
    levelDistribution,
    dailyCompletions,
  };
}
