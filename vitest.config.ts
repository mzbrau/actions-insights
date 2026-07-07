import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['test/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@actions-insights/history-models': path.resolve(__dirname, 'packages/history-models/src/index.ts'),
      '@actions-insights/history-publisher': path.resolve(__dirname, 'packages/history-publisher/src/index.ts'),
    },
  },
});
