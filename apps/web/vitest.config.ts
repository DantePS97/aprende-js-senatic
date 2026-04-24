import { mergeConfig, defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import sharedConfig from '../../vitest.shared';
import { transformSync } from 'esbuild';

// Transforms JSX/TSX in SSR mode (jsdom tests) because vitest 4 + rolldown
// can't parse JSX syntax before @vitejs/plugin-react applies its transform.
const ssrJsxPlugin = {
  name: 'ssr-jsx-transform',
  enforce: 'pre' as const,
  transform(code: string, id: string) {
    if (!id.match(/\.[jt]sx$/)) return null;
    const result = transformSync(code, {
      loader: id.endsWith('.tsx') ? 'tsx' : 'jsx',
      jsx: 'automatic',
      jsxImportSource: 'react',
      target: 'node20',
      format: 'esm',
    });
    return { code: result.code, map: result.map };
  },
};

export default mergeConfig(
  sharedConfig,
  defineConfig({
    plugins: [ssrJsxPlugin, react()],
    test: {
      environment: 'jsdom',
      setupFiles: ['./vitest.setup.ts'],
      include: ['src/**/*.test.{ts,tsx}'],
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  }),
);
