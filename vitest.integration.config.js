import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: false,
    environment: 'node',
    include: ['tests/integration/**/*.test.js'],
    testTimeout: 120000
  }
});
