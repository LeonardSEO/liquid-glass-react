// The skill ships a copy of the engine for projects that cannot install the package.
import { cpSync, readdirSync, rmSync } from "node:fs"

const source = new URL("../src/", import.meta.url)
const target = new URL("../skills/liquid-glass/assets/", import.meta.url)

for (const file of readdirSync(target)) rmSync(new URL(file, target))
for (const file of readdirSync(source)) cpSync(new URL(file, source), new URL(file, target))
