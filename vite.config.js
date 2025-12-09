import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist', // Cloudflare Pages expects this by default
    sourcemap: false // Disable sourcemaps for production
  },
  // Ensure Vite handles environment variables correctly
  define: {
    'process.env': {}
  }
})