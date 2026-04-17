import { describe, it, expect } from 'vitest';
import { getWeekBounds } from './week-bounds';

describe('getWeekBounds', () => {
  it('returns Monday as start for a Wednesday input', () => {
    const wed = new Date('2025-01-08T12:00:00Z'); // Wednesday
    const { start, end } = getWeekBounds(wed);
    expect(start.toISOString()).toBe('2025-01-06T00:00:00.000Z'); // Monday
    expect(end.toISOString()).toBe('2025-01-13T00:00:00.000Z');   // next Monday
  });

  it('returns itself as start when input is Monday', () => {
    const mon = new Date('2025-01-06T00:00:00Z');
    const { start } = getWeekBounds(mon);
    expect(start.toISOString()).toBe('2025-01-06T00:00:00.000Z');
  });

  it('returns previous Monday as start when input is Sunday', () => {
    const sun = new Date('2025-01-12T15:00:00Z'); // Sunday
    const { start } = getWeekBounds(sun);
    expect(start.toISOString()).toBe('2025-01-06T00:00:00.000Z');
  });

  it('week spanning year boundary — 2020-12-31 belongs to week starting 2020-12-28', () => {
    const dec31 = new Date('2020-12-31T00:00:00Z'); // Thursday
    const { start, end } = getWeekBounds(dec31);
    expect(start.toISOString()).toBe('2020-12-28T00:00:00.000Z'); // Monday
    expect(end.toISOString()).toBe('2021-01-04T00:00:00.000Z');
  });

  it('end is always exactly 7 days after start', () => {
    const arbitrary = new Date('2024-06-15T09:00:00Z');
    const { start, end } = getWeekBounds(arbitrary);
    const diffMs = end.getTime() - start.getTime();
    expect(diffMs).toBe(7 * 24 * 60 * 60 * 1000);
  });
});
