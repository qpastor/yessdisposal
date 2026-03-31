import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
  preview: {
    port: parseInt(process.env.PORT) || 5173,
    host: true,
    allowedHosts: true // Helps with external access on some providers
  }, // REMOVED tailwindcss()
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})