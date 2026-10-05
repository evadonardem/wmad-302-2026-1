import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load .env (and any variables passed in by Docker). '' = load every key, not just VITE_*
  const env = loadEnv(mode, process.cwd(), '')
  const pexelsKey = env.VITE_PEXELS_API_KEY || env.PEXELS_API_KEY

  return {
    plugins: [react()],
    server: {
      host: true,
      port: 5173,
      proxy: {
        '/pexels': {
          target: 'https://api.pexels.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/pexels/, ''),
          // The proxy adds the API key itself, so Pexels gets it even if the browser code doesn't send it
          headers: pexelsKey ? { Authorization: pexelsKey } : {},
          configure: (proxy) => {
            if (!pexelsKey) {
              console.warn('[vite] No VITE_PEXELS_API_KEY found - Pexels requests will return 401.')
            }
          },
        },
      },
    },
  }
})
