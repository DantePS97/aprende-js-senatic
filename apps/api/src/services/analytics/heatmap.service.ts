import { ProgressModel } from '../../models/Progress.model';
import { BOGOTA_TZ } from '../../lib/constants';
import type { HeatmapCell, ActivityHeatmapResponse } from '@senatic/shared';
import { defaultRange, type QueryParams } from './base';

// MongoDB $dayOfWeek: 1=Sun … 7=Sat → ISO: 0=Mon … 6=Sun
function mongoWeekdayToISO(dow: number): number {
  return dow === 1 ? 6 : dow - 2;
}

export async function getActivityHeatmap(
  params: QueryParams = {},
): Promise<ActivityHeatmapResponse> {
  const { from, to } = defaultRange(params.from, params.to);

  const agg = await ProgressModel.aggregate([
    {
      $match: {
        status: 'completed',
        completedAt: { $gte: from, $lte: to },
      },
    },
    {
      $group: {
        _id: {
          day: { $dayOfWeek: { date: '$completedAt', timezone: BOGOTA_TZ } },
          hour: { $hour: { date: '$completedAt', timezone: BOGOTA_TZ } },
        },
        count: { $sum: 1 },
      },
    },
  ]);

  const countMap = new Map<string, number>();
  for (const row of agg) {
    const day = mongoWeekdayToISO(row._id.day);
    countMap.set(`${day}:${row._id.hour}`, row.count);
  }

  const cells: HeatmapCell[] = [];
  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      cells.push({ day, hour, count: countMap.get(`${day}:${hour}`) ?? 0 });
    }
  }

  const maxCount = Math.max(...cells.map((c) => c.count), 1);
  const totalCompletions = cells.reduce((s, c) => s + c.count, 0);

  const dayTotals = Array.from({ length: 7 }, (_, d) =>
    cells.filter((c) => c.day === d).reduce((s, c) => s + c.count, 0),
  );
  const peakDay = dayTotals.indexOf(Math.max(...dayTotals));

  const hourTotals = Array.from({ length: 24 }, (_, h) =>
    cells.filter((c) => c.hour === h).reduce((s, c) => s + c.count, 0),
  );
  const peakHour = hourTotals.indexOf(Math.max(...hourTotals));

  return { cells, maxCount, totalCompletions, peakDay, peakHour };
}
