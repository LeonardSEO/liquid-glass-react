import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// src/liquid-glass is a symlink to ../components (the library source).
// preserveSymlinks makes `react` resolve from this demo's node_modules.
export default defineConfig({
  plugins: [react()],
  resolve: { preserveSymlinks: true },
  server: { fs: { allow: ['..'] } },
})
