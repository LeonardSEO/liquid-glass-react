import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const src = (p: string) => fileURLToPath(new URL(`../src/${p}`, import.meta.url))

// The demo imports the package by name; during development that name points
// straight at the library source in ../src (no build step, full HMR).
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: /^@vepando\/liquid-glass-react\/style\.css$/, replacement: src('liquid-glass.css') },
      { find: /^@vepando\/liquid-glass-react$/, replacement: src('index.ts') },
    ],
    dedupe: ['react', 'react-dom'],
  },
  server: { fs: { allow: ['..'] } },
})
