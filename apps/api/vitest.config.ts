import { mergeConfig } from 'vitest/config';
import { resolve } from 'path';
import sharedConfig from '../../vitest.shared';

export default mergeConfig(sharedConfig, {
  resolve: {
    alias: {
      // Resolve @senatic/shared to TypeScript source so Vitest doesn't need
      // the compiled dist/ output — avoids having to rebuild on every change.
      '@senatic/shared': resolve(__dirname, '../../packages/shared/src/index.ts'),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    setupFiles: ['./vitest.setup.ts'],
  },
});
