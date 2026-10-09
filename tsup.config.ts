import { copyFileSync } from "node:fs"
import { defineConfig } from "tsup"

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  sourcemap: true,
  target: "es2020",
  external: ["react", "react-dom"],
  // The component uses hooks and browser APIs: mark the bundle as a
  // client module for React Server Components (Next.js App Router).
  banner: { js: '"use client";' },
  onSuccess: async () => {
    copyFileSync("src/liquid-glass.css", "dist/style.css")
  },
})
