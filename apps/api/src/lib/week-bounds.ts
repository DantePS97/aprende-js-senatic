export interface WeekBounds {
  start: Date;
  end: Date;
}

/**
 * Returns the UTC Monday 00:00:00 start and the following Monday 00:00:00 end
 * for the ISO week that contains the given date (defaults to now).
 */
export function getWeekBounds(now = new Date()): WeekBounds {
  const dayOfWeek = now.getUTCDay(); // 0=Sun … 6=Sat
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  const start = new Date(now);
  start.setUTCDate(now.getUTCDate() - daysFromMonday);
  start.setUTCHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 7);

  return { start, end };
}
