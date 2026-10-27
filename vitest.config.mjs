import { defineConfig } from 'vitest/config';

// Only the SDK's own tests; the example app has its own Jest setup.
export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
  },
});
