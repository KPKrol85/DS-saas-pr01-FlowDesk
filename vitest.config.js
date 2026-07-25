import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    environmentOptions: {
      jsdom: {
        url: 'http://127.0.0.1/'
      }
    },
    setupFiles: ['./tests/helpers/vitest.setup.js'],
    restoreMocks: true,
    exclude: [...configDefaults.exclude, 'tests/e2e/**', 'tests/a11y/**']
  }
});
