import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.{ts,js}'],
    coverage: {
      reporter: ['text', 'json', 'html'],
    },
    alias: {
      '@/': new URL('./src/', import.meta.url).pathname,
    },
  },
  esbuild: {
    target: 'node18',
  },
});
