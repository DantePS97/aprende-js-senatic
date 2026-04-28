// JWT secrets required by jwt.ts — set before any test imports the module
process.env.JWT_ACCESS_SECRET = 'test-access-secret-vitest';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-vitest';
process.env.APP_WEB_URL = 'http://localhost:3000';
