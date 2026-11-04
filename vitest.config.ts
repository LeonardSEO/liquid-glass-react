import { fileURLToPath } from "node:url"
import { defineConfig } from "vitest/config"

const path = (p: string) => fileURLToPath(new URL(p, import.meta.url))

export default defineConfig({
  resolve: {
    alias: [
      { find: /^@vepando\/liquid-glass-react\/style\.css$/, replacement: path("./src/liquid-glass.css") },
      { find: /^@vepando\/liquid-glass-react$/, replacement: path("./src/index.ts") },
      { find: /^@\/registry\/(.*)$/, replacement: path("./registry/$1") },
      { find: /^@\/lib\/utils$/, replacement: path("./tests/utils.ts") },
    ],
  },
  test: {
    environment: "jsdom",
    include: ["tests/**/*.test.tsx"],
    setupFiles: ["tests/setup.ts"],
  },
})
