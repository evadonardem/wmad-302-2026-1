import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api-psgc': {
        target: 'https://psgc.gitlab.io/api',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-psgc/, '')
      }
    }
  }
});