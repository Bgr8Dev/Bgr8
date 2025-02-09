import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

// Correct Vite configuration with SWC
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
  },
  server: {
    fs: {
      strict: false,
    },
  }
});
