import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// Only the SDK's own tests; the example app has its own Jest setup. The render tests use a small stand-in for
// React Native (test/mocks/react-native.ts).
export default defineConfig({
  resolve: {
    alias: { 'react-native': fileURLToPath(new URL('./test/mocks/react-native.ts', import.meta.url)) },
  },
  test: {
    include: ['test/**/*.test.{ts,tsx}'],
  },
});
