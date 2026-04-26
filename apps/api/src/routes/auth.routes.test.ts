import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../app';

// ─── Mock service layer ───────────────────────────────────────────────────────

// email.service instantiates Resend at module load — stub it to avoid
// requiring RESEND_API_KEY in the test environment.
vi.mock('../services/email.service', () => ({
  emailService: { sendPasswordReset: vi.fn() },
}));

vi.mock('../services/auth.service', () => ({
  requestPasswordReset: vi.fn(),
  validateResetToken: vi.fn(),
  resetPassword: vi.fn(),
}));

import {
  requestPasswordReset,
  validateResetToken,
  resetPassword,
} from '../services/auth.service';

// ─── POST /api/auth/forgot-password ──────────────────────────────────────────

describe('POST /api/auth/forgot-password', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 400 for missing email', async () => {
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({});
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid email format', async () => {
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'not-an-email' });
    expect(res.status).toBe(400);
  });

  it('returns 200 and generic message when email exists', async () => {
    vi.mocked(requestPasswordReset).mockResolvedValue(undefined);

    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'user@example.com' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.message).toBeTruthy();
    expect(requestPasswordReset).toHaveBeenCalledWith('user@example.com');
  });

  it('still returns 200 (anti-enumeration) even when service throws', async () => {
    vi.mocked(requestPasswordReset).mockRejectedValue(new Error('email not found'));

    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'ghost@example.com' });

    // Must NEVER reveal whether the email exists
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

// ─── GET /api/auth/reset-password/validate ───────────────────────────────────

describe('GET /api/auth/reset-password/validate', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 400 for missing token', async () => {
    const res = await request(app).get('/api/auth/reset-password/validate');
    expect(res.status).toBe(400);
  });

  it('returns 400 for short token', async () => {
    const res = await request(app)
      .get('/api/auth/reset-password/validate')
      .query({ token: 'short' });
    expect(res.status).toBe(400);
  });

  it('returns 200 with valid token', async () => {
    const mockResult = { email: 'user@example.com' };
    vi.mocked(validateResetToken).mockResolvedValue(mockResult as any);

    const validToken = 'a'.repeat(64);
    const res = await request(app)
      .get('/api/auth/reset-password/validate')
      .query({ token: validToken });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual(mockResult);
    expect(validateResetToken).toHaveBeenCalledWith(validToken);
  });

  it('returns 500 when service throws', async () => {
    vi.mocked(validateResetToken).mockRejectedValue(new Error('expired'));

    const res = await request(app)
      .get('/api/auth/reset-password/validate')
      .query({ token: 'b'.repeat(64) });

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });
});

// ─── POST /api/auth/reset-password ───────────────────────────────────────────

describe('POST /api/auth/reset-password', () => {
  beforeEach(() => vi.clearAllMocks());

  const validToken = 'c'.repeat(64);

  it('returns 400 for missing fields', async () => {
    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({});
    expect(res.status).toBe(400);
  });

  it('returns 400 for password too short', async () => {
    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: validToken, newPassword: '123' });
    expect(res.status).toBe(400);
  });

  it('resets password successfully', async () => {
    vi.mocked(resetPassword).mockResolvedValue(undefined);

    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: validToken, newPassword: 'NuevaPass123!' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(resetPassword).toHaveBeenCalledWith(validToken, 'NuevaPass123!');
  });

  it('returns 400 when token is expired or invalid', async () => {
    const err = Object.assign(new Error('expired'), { statusCode: 400 });
    vi.mocked(resetPassword).mockRejectedValue(err);

    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: validToken, newPassword: 'NuevaPass123!' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns 500 for unexpected service error', async () => {
    vi.mocked(resetPassword).mockRejectedValue(new Error('DB error'));

    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: validToken, newPassword: 'NuevaPass123!' });

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });
});
