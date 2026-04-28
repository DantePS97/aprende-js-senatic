const REQUIRED_SECRETS: Array<{ key: string; insecurePrefix?: string }> = [
  { key: 'JWT_ACCESS_SECRET', insecurePrefix: 'dev_' },
  { key: 'JWT_REFRESH_SECRET', insecurePrefix: 'dev_' },
];

const REQUIRED_VARS = ['APP_WEB_URL'];

export function validateEnv(): void {
  for (const { key, insecurePrefix } of REQUIRED_SECRETS) {
    const value = process.env[key];
    if (!value) {
      throw new Error(`${key} is required but not set`);
    }
    if (insecurePrefix && value.startsWith(insecurePrefix)) {
      throw new Error(`${key} is set to an insecure development default — set a secure value`);
    }
  }

  for (const key of REQUIRED_VARS) {
    if (!process.env[key]) {
      throw new Error(`${key} is required but not set`);
    }
  }
}
