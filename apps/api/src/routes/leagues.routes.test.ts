import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../app';
import { signAccessToken } from '../lib/jwt';

// ─── Mock service layer ───────────────────────────────────────────────────────

// email.service instantiates Resend at module load — stub it to avoid
// requiring RESEND_API_KEY in the test environment.
vi.mock('../services/email.service', () => ({
  emailService: { sendPasswordReset: vi.fn() },
}));

vi.mock('../services/league.service', () => ({
  getCurrentWeekStatus: vi.fn(),
  getWeeklyLeague: vi.fn(),
  getUserLeagueHistory: vi.fn(),
}));

import {
  getCurrentWeekStatus,
  getWeeklyLeague,
  getUserLeagueHistory,
} from '../services/league.service';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TEST_USER = { userId: 'user-123', email: 'test@example.com', isAdmin: false };
const authHeader = () => ({ Authorization: `Bearer ${signAccessToken(TEST_USER)}` });

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('GET /api/leagues/current', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 401 without auth token', async () => {
    const res = await request(app).get('/api/leagues/current');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('returns 401 with malformed token', async () => {
    const res = await request(app)
      .get('/api/leagues/current')
      .set('Authorization', 'Bearer not-a-real-token');
    expect(res.status).toBe(401);
  });

  it('returns current week status for authenticated user', async () => {
    const mockStatus = { tier: 'gold', weeklyXp: 850, weekStart: '2026-04-21' };
    vi.mocked(getCurrentWeekStatus).mockResolvedValue(mockStatus as any);

    const res = await request(app)
      .get('/api/leagues/current')
      .set(authHeader());

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual(mockStatus);
    expect(getCurrentWeekStatus).toHaveBeenCalledWith(TEST_USER.userId);
  });

  it('returns 500 when service throws', async () => {
    vi.mocked(getCurrentWeekStatus).mockRejectedValue(new Error('DB down'));

    const res = await request(app)
      .get('/api/leagues/current')
      .set(authHeader());

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });
});

describe('GET /api/leagues/weekly', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 401 without auth token', async () => {
    const res = await request(app).get('/api/leagues/weekly');
    expect(res.status).toBe(401);
  });

  it('returns weekly leaderboard grouped by tier', async () => {
    const mockLeague = {
      weekStart: '2026-04-21',
      weekEnd:   '2026-04-27',
      gold:   [{ userId: 'u1', displayName: 'Alice', weeklyXp: 900, level: 5, rank: 1 }],
      silver: [],
      bronze: [],
    };
    vi.mocked(getWeeklyLeague).mockResolvedValue(mockLeague as any);

    const res = await request(app)
      .get('/api/leagues/weekly')
      .set(authHeader());

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual(mockLeague);
    expect(getWeeklyLeague).toHaveBeenCalledOnce();
  });

  it('returns 500 when service throws', async () => {
    vi.mocked(getWeeklyLeague).mockRejectedValue(new Error('timeout'));

    const res = await request(app)
      .get('/api/leagues/weekly')
      .set(authHeader());

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });
});

describe('GET /api/leagues/history', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 401 without auth token', async () => {
    const res = await request(app).get('/api/leagues/history');
    expect(res.status).toBe(401);
  });

  it('returns history for authenticated user', async () => {
    const mockHistory = [
      { weekStart: '2026-04-14', tier: 'silver', weeklyXp: 450, rank: 3 },
      { weekStart: '2026-04-07', tier: 'bronze', weeklyXp: 120, rank: 8 },
    ];
    vi.mocked(getUserLeagueHistory).mockResolvedValue(mockHistory as any);

    const res = await request(app)
      .get('/api/leagues/history')
      .set(authHeader());

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual(mockHistory);
    expect(getUserLeagueHistory).toHaveBeenCalledWith(TEST_USER.userId);
  });

  it('returns 500 when service throws', async () => {
    vi.mocked(getUserLeagueHistory).mockRejectedValue(new Error('fail'));

    const res = await request(app)
      .get('/api/leagues/history')
      .set(authHeader());

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });
});
