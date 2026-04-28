import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { validateEnv } from './env';

const REQUIRED = {
  JWT_ACCESS_SECRET: 'super-secure-access-secret',
  JWT_REFRESH_SECRET: 'super-secure-refresh-secret',
  APP_WEB_URL: 'https://app.example.com',
};

beforeEach(() => {
  Object.assign(process.env, REQUIRED);
});

afterEach(() => {
  delete process.env.JWT_ACCESS_SECRET;
  delete process.env.JWT_REFRESH_SECRET;
  delete process.env.APP_WEB_URL;
});

describe('validateEnv', () => {
  it('does not throw when all required env vars are present and secure', () => {
    expect(() => validateEnv()).not.toThrow();
  });

  it('throws when JWT_ACCESS_SECRET is missing', () => {
    delete process.env.JWT_ACCESS_SECRET;
    expect(() => validateEnv()).toThrow('JWT_ACCESS_SECRET');
  });

  it('throws when JWT_REFRESH_SECRET is missing', () => {
    delete process.env.JWT_REFRESH_SECRET;
    expect(() => validateEnv()).toThrow('JWT_REFRESH_SECRET');
  });

  it('throws when JWT_ACCESS_SECRET uses the insecure dev default', () => {
    process.env.JWT_ACCESS_SECRET = 'dev_access_secret_change_in_prod';
    expect(() => validateEnv()).toThrow('JWT_ACCESS_SECRET');
  });

  it('throws when JWT_REFRESH_SECRET uses the insecure dev default', () => {
    process.env.JWT_REFRESH_SECRET = 'dev_refresh_secret_change_in_prod';
    expect(() => validateEnv()).toThrow('JWT_REFRESH_SECRET');
  });

  it('throws when APP_WEB_URL is missing', () => {
    delete process.env.APP_WEB_URL;
    expect(() => validateEnv()).toThrow('APP_WEB_URL');
  });
});
