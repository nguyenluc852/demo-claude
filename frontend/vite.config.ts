import react from '@vitejs/plugin-react'
import { loadEnv } from 'vite'
import { defineConfig } from 'vitest/config'

const API_PREFIX = '/api'
const DEFAULT_PROXY_TARGET = 'http://127.0.0.1:8000'
const DEV_PORT = 5173

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    server: {
      port: DEV_PORT,
      // Keeps the browser on one origin in dev, so no CORS preflight is involved.
      // In Docker the target is the backend service name, hence the override.
      proxy: {
        [API_PREFIX]: {
          target: env.VITE_PROXY_TARGET || DEFAULT_PROXY_TARGET,
          changeOrigin: true,
        },
      },
    },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: './src/test/setup.ts',
    },
  }
})
