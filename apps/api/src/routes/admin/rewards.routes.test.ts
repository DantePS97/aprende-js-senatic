import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../app';
import { signAccessToken } from '../../lib/jwt';

// ─── Module-level stubs ───────────────────────────────────────────────────────

vi.mock('../../services/email.service', () => ({
  emailService: { sendPasswordReset: vi.fn() },
}));

vi.mock('../../services/reward.service', () => ({
  provisionModuleBadge: vi.fn().mockResolvedValue(undefined),
  grantAchievement: vi.fn(),
}));

import { grantAchievement } from '../../services/reward.service';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ADMIN_USER = { userId: '507f1f77bcf86cd799439011', email: 'admin@example.com', isAdmin: true };
const NON_ADMIN_USER = { userId: '507f1f77bcf86cd799439044', email: 'student@example.com', isAdmin: false };
const authHeader = () => ({ Authorization: `Bearer ${signAccessToken(ADMIN_USER)}` });
const nonAdminAuthHeader = () => ({ Authorization: `Bearer ${signAccessToken(NON_ADMIN_USER)}` });

const USER_ID = '507f1f77bcf86cd799439022';
const ACHIEVEMENT_ID = '507f1f77bcf86cd799439033';

// ─── POST /api/admin/rewards/grant ────────────────────────────────────────────

describe('POST /api/admin/rewards/grant', () => {
  beforeEach(() => vi.clearAllMocks());

  it('403s and does not grant when the caller is authenticated but not an admin', async () => {
    const res = await request(app)
      .post('/api/admin/rewards/grant')
      .set(nonAdminAuthHeader())
      .send({ userId: USER_ID, achievementId: ACHIEVEMENT_ID });

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ success: false, error: 'FORBIDDEN' });
    expect(grantAchievement).not.toHaveBeenCalled();
  });

  it('400s when userId is missing', async () => {
    const res = await request(app)
      .post('/api/admin/rewards/grant')
      .set(authHeader())
      .send({ achievementId: ACHIEVEMENT_ID });

    expect(res.status).toBe(400);
    expect(grantAchievement).not.toHaveBeenCalled();
  });

  it('400s when achievementId is not a valid ObjectId string', async () => {
    const res = await request(app)
      .post('/api/admin/rewards/grant')
      .set(authHeader())
      .send({ userId: USER_ID, achievementId: 'not-an-object-id' });

    expect(res.status).toBe(400);
    expect(grantAchievement).not.toHaveBeenCalled();
  });

  it('200s with granted:true on a new grant', async () => {
    vi.mocked(grantAchievement).mockResolvedValue({
      status: 'GRANTED',
      achievement: { _id: ACHIEVEMENT_ID, key: 'module-completed-x', title: 'Badge' },
    } as any);

    const res = await request(app)
      .post('/api/admin/rewards/grant')
      .set(authHeader())
      .send({ userId: USER_ID, achievementId: ACHIEVEMENT_ID });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      success: true,
      data: {
        granted: true,
        alreadyEarned: false,
        achievement: { _id: ACHIEVEMENT_ID, key: 'module-completed-x', title: 'Badge' },
      },
    });
    expect(grantAchievement).toHaveBeenCalledWith({
      userId: USER_ID,
      achievementId: ACHIEVEMENT_ID,
      grantedBy: ADMIN_USER.userId,
    });
  });

  it('200s with alreadyEarned:true when the student already has the achievement', async () => {
    vi.mocked(grantAchievement).mockResolvedValue({
      status: 'ALREADY_EARNED',
      achievement: { _id: ACHIEVEMENT_ID, key: 'module-completed-x', title: 'Badge' },
    } as any);

    const res = await request(app)
      .post('/api/admin/rewards/grant')
      .set(authHeader())
      .send({ userId: USER_ID, achievementId: ACHIEVEMENT_ID });

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({
      granted: false,
      alreadyEarned: true,
      achievement: { _id: ACHIEVEMENT_ID, key: 'module-completed-x', title: 'Badge' },
    });
  });

  it('404s when the user does not exist', async () => {
    vi.mocked(grantAchievement).mockResolvedValue({ status: 'USER_NOT_FOUND' } as any);

    const res = await request(app)
      .post('/api/admin/rewards/grant')
      .set(authHeader())
      .send({ userId: USER_ID, achievementId: ACHIEVEMENT_ID });

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ success: false, error: 'USER_NOT_FOUND' });
  });

  it('404s when the achievement does not exist', async () => {
    vi.mocked(grantAchievement).mockResolvedValue({ status: 'ACHIEVEMENT_NOT_FOUND' } as any);

    const res = await request(app)
      .post('/api/admin/rewards/grant')
      .set(authHeader())
      .send({ userId: USER_ID, achievementId: ACHIEVEMENT_ID });

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ success: false, error: 'ACHIEVEMENT_NOT_FOUND' });
  });
});
