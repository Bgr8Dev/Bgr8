import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import emulatorCheckPlugin from './vite-plugins/emulator-check.js';

// Correct Vite configuration with SWC
export default defineConfig({
  plugins: [react(), emulatorCheckPlugin()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
  server: {
    fs: {
      strict: false,
    },
  },
  base: './'
});
