import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path' // 1. Import path

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // 2. Define @ as the src folder
      "@": path.resolve(__dirname, "./src"),
    },
  },
})