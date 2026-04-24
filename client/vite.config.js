import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
  build: {
    // This tells Vite to put the build files one level up from the client folder
    outDir: 'dist', 
    emptyOutDir: true, // This ensures the old files are cleared out first
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