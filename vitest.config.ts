import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    globals: false,
    env: {
      NODE_ENV: 'test',
      DB_PASSWORD: 'test-password',
    },
  },
});
