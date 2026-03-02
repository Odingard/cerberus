import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  root: '.',
  server: {
    allowedHosts: true,
  },
  resolve: {
    alias: {
      'better-sqlite3': path.resolve(__dirname, 'src/stubs/better-sqlite3.ts'),
    },
  },
  build: {
    outDir: 'dist',
  },
});
