import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

const src = (p: string) => fileURLToPath(new URL(`../src/${p}`, import.meta.url))

// The demo imports the package by name; during development that name points
// straight at the library source in ../src (no build step, full HMR).
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: [
      { find: /^@vepando\/liquid-glass-react\/style\.css$/, replacement: src('liquid-glass.css') },
      { find: /^@vepando\/liquid-glass-react$/, replacement: src('index.ts') },
      // The same import paths a project gets from the shadcn CLI.
      { find: /^@\/registry\/(.*)$/, replacement: fileURLToPath(new URL('../registry/$1', import.meta.url)) },
      { find: /^@\/lib\/utils$/, replacement: fileURLToPath(new URL('./src/lib/utils.ts', import.meta.url)) },
    ],
    dedupe: ['react', 'react-dom', '@base-ui/react'],
  },
  server: { fs: { allow: ['..'] } },
})
