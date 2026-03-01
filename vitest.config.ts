import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/adapters/**',         // Phase 4 stubs
        'src/graph/**',            // Phase 3 stubs
        'src/layers/l4-memory.ts', // Phase 3 stub
        'src/**/index.ts',         // Barrel re-exports only
        'src/types/**',            // Type-only files (no runtime code)
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});
