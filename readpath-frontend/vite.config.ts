import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      }
    }
  },
  // In production the frontend fetches from VITE_API_URL (set in Vercel env vars)
  // In dev the Vite proxy above handles /api → localhost:5000
  define: {
    __API_BASE__: JSON.stringify(process.env.VITE_API_URL ?? ''),
  },
})
