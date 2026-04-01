import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@block-based/block-builder': path.resolve(__dirname, '../../packages/block-builder/src/index.ts'),
    },
  },
});
