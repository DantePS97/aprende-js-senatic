import { describe, it, expect } from 'vitest';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  submitProgressSchema,
  syncEventSchema,
  syncRequestSchema,
  createPostSchema,
  createReplySchema,
} from './index';

describe('registerSchema', () => {
  it('accepts valid registration data', () => {
    const result = registerSchema.safeParse({
      email: 'user@example.com',
      password: 'secret123',
      displayName: 'María López',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const result = registerSchema.safeParse({
      email: 'not-an-email',
      password: 'secret123',
      displayName: 'María',
    });
    expect(result.success).toBe(false);
  });

  it('rejects password shorter than 8 chars', () => {
    const result = registerSchema.safeParse({
      email: 'user@example.com',
      password: 'short',
      displayName: 'María',
    });
    expect(result.success).toBe(false);
  });
});

describe('loginSchema', () => {
  it('accepts valid credentials', () => {
    expect(loginSchema.safeParse({ email: 'a@b.com', password: 'x' }).success).toBe(true);
  });

  it('rejects empty password', () => {
    expect(loginSchema.safeParse({ email: 'a@b.com', password: '' }).success).toBe(false);
  });
});

describe('refreshTokenSchema', () => {
  it('accepts a non-empty token', () => {
    expect(refreshTokenSchema.safeParse({ refreshToken: 'abc' }).success).toBe(true);
  });

  it('rejects empty token', () => {
    expect(refreshTokenSchema.safeParse({ refreshToken: '' }).success).toBe(false);
  });
});

describe('submitProgressSchema', () => {
  it('accepts valid progress submission', () => {
    const result = submitProgressSchema.safeParse({
      lessonId: 'lesson-1',
      passed: true,
      hintsUsed: 0,
      completedAt: '2025-04-17T12:00:00Z',
    });
    expect(result.success).toBe(true);
  });

  it('rejects hintsUsed above 10', () => {
    const result = submitProgressSchema.safeParse({
      lessonId: 'lesson-1',
      passed: true,
      hintsUsed: 11,
      completedAt: '2025-04-17T12:00:00Z',
    });
    expect(result.success).toBe(false);
  });
});

describe('syncRequestSchema', () => {
  const validEvent = {
    lessonId: 'lesson-1',
    passed: true,
    hintsUsed: 0,
    completedAt: '2025-04-17T12:00:00Z',
    localId: 'local-abc',
  };

  it('accepts array of valid sync events', () => {
    expect(syncRequestSchema.safeParse({ events: [validEvent] }).success).toBe(true);
  });

  it('rejects empty events array', () => {
    expect(syncRequestSchema.safeParse({ events: [] }).success).toBe(false);
  });
});

describe('createPostSchema', () => {
  it('accepts valid post', () => {
    const result = createPostSchema.safeParse({
      title: 'Cómo funciona el closure en JS',
      body: 'Un closure es una función que recuerda el entorno en el que fue creada y puede acceder a variables de ese entorno.',
    });
    expect(result.success).toBe(true);
  });

  it('rejects title shorter than 5 chars', () => {
    expect(createPostSchema.safeParse({ title: 'Hi', body: 'valid body text here that is long enough' }).success).toBe(false);
  });

  it('rejects body shorter than 20 chars', () => {
    expect(createPostSchema.safeParse({ title: 'Valid title here', body: 'Too short' }).success).toBe(false);
  });
});

describe('createReplySchema', () => {
  it('accepts valid reply', () => {
    expect(createReplySchema.safeParse({ body: 'Esta es una respuesta válida con más de cinco caracteres.' }).success).toBe(true);
  });

  it('rejects body shorter than 5 chars', () => {
    expect(createReplySchema.safeParse({ body: 'Ok' }).success).toBe(false);
  });
});
