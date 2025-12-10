import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // CRITICAL: This must match your GitHub Repository name exactly, including dashes.
  base: '/-Deadlock-Detective-Tool-/', 
  build: {
    outDir: 'dist',
    sourcemap: true
  }
});