import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // The HRMS & Finance module (src/hrms) imports its own files as '@/...'.
  resolve: { alias: { '@': fileURLToPath(new URL('./src/hrms', import.meta.url)) } },
})
