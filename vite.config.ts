import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  base: './', // Crucial for Electron local file:// loading
  plugins: [
    react(),
    tailwindcss()
  ],
  build: {
    sourcemap: true,
  },
  server: {
    port: 5173,
    host: true
  }
})
