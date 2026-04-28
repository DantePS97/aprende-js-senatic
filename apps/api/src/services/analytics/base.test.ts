import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { defaultRange, fillDateGaps } from './base';
import { DEFAULT_RANGE_DAYS } from '../../lib/constants';

// ─── defaultRange ─────────────────────────────────────────────────────────────

describe('defaultRange', () => {
  const FIXED_NOW = new Date('2026-04-27T12:00:00Z');

  beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_NOW);
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it('returns the provided from/to unchanged', () => {
    const from = new Date('2026-01-01T00:00:00Z');
    const to   = new Date('2026-01-31T00:00:00Z');
    const result = defaultRange(from, to);
    expect(result.from).toBe(from);
    expect(result.to).toBe(to);
  });

  it('uses current time as `to` when not provided', () => {
    const { to } = defaultRange();
    expect(to.getTime()).toBe(FIXED_NOW.getTime());
  });

  it(`defaults \`from\` to ${DEFAULT_RANGE_DAYS} days before \`to\``, () => {
    const { from, to } = defaultRange();
    const diffMs = to.getTime() - from.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    expect(diffDays).toBe(DEFAULT_RANGE_DAYS);
  });

  it('derives `from` relative to a provided `to`', () => {
    const to = new Date('2026-03-15T00:00:00Z');
    const { from } = defaultRange(undefined, to);
    const diffDays = (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24);
    expect(diffDays).toBe(DEFAULT_RANGE_DAYS);
  });
});

// ─── fillDateGaps ─────────────────────────────────────────────────────────────

describe('fillDateGaps', () => {
  it('returns an entry for every day between from and to (inclusive)', () => {
    const from = new Date('2026-04-01T00:00:00Z');
    const to   = new Date('2026-04-05T00:00:00Z');
    const result = fillDateGaps([], from, to);
    expect(result).toHaveLength(5);
    expect(result[0].date).toBe('2026-04-01');
    expect(result[4].date).toBe('2026-04-05');
  });

  it('fills missing days with count = 0', () => {
    const from = new Date('2026-04-01T00:00:00Z');
    const to   = new Date('2026-04-03T00:00:00Z');
    const result = fillDateGaps([], from, to);
    expect(result).toEqual([
      { date: '2026-04-01', count: 0 },
      { date: '2026-04-02', count: 0 },
      { date: '2026-04-03', count: 0 },
    ]);
  });

  it('uses the count from a matching point', () => {
    const from = new Date('2026-04-01T00:00:00Z');
    const to   = new Date('2026-04-03T00:00:00Z');
    const result = fillDateGaps([{ date: '2026-04-02', count: 7 }], from, to);
    expect(result).toEqual([
      { date: '2026-04-01', count: 0 },
      { date: '2026-04-02', count: 7 },
      { date: '2026-04-03', count: 0 },
    ]);
  });

  it('returns a single entry when from equals to', () => {
    const day = new Date('2026-04-15T08:30:00Z');
    const result = fillDateGaps([{ date: '2026-04-15', count: 3 }], day, day);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ date: '2026-04-15', count: 3 });
  });

  it('handles a range spanning a month boundary', () => {
    const from = new Date('2026-03-30T00:00:00Z');
    const to   = new Date('2026-04-02T00:00:00Z');
    const result = fillDateGaps([], from, to);
    expect(result.map((r) => r.date)).toEqual([
      '2026-03-30',
      '2026-03-31',
      '2026-04-01',
      '2026-04-02',
    ]);
  });

  it('ignores points outside the from–to window', () => {
    const from = new Date('2026-04-10T00:00:00Z');
    const to   = new Date('2026-04-12T00:00:00Z');
    const result = fillDateGaps(
      [
        { date: '2026-04-09', count: 99 }, // before window
        { date: '2026-04-11', count: 5 },
        { date: '2026-04-13', count: 99 }, // after window
      ],
      from,
      to,
    );
    expect(result).toEqual([
      { date: '2026-04-10', count: 0 },
      { date: '2026-04-11', count: 5 },
      { date: '2026-04-12', count: 0 },
    ]);
  });
});
