import { mergeConfig, defineConfig } from 'vitest/config';

export default mergeConfig(defineConfig({}), {
  test: {
    globals: true,
    passWithNoTests: true,
    coverage: {
      provider: 'v8',
      reporter: ['text-summary', 'lcov'],
    },
  },
});
