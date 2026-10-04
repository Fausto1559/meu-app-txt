import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    testTimeout: 30000,
    setupFiles: ['./src/setupTests.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: ['node_modules', 'dist', '.git'],
    coverage: {
      provider: 'v8',
      include: [
        'src/App.tsx',
        'src/components/FieldCardsGrid.tsx',
        'src/components/ModalsAndTools.tsx',
        'src/components/ReportsSection.tsx',
        'src/components/VoiceFieldControls.tsx',
        'src/utils/financeUtils.ts',
      ],
    },
  },
});