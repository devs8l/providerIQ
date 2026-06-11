import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Local `vite preview` only: forward the production '/api' calls to the
  // running API server. On Vercel, vercel.json rewrites handle this instead.
  preview: {
    proxy: {
      '/api': { target: 'http://localhost:4000', changeOrigin: true },
    },
  },
})
