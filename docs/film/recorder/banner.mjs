// Renders docs/banner.jpg from the demo's ?scene=banner at 2x.
import { open } from "./rec.mjs"

const out = process.argv[2] ?? "../../banner.png"
const rec = await open("?scene=banner", { width: 1280, height: 480, scale: 2 })
await rec.page.screenshot({ path: out, clip: { x: 0, y: 0, width: 1280, height: 480 } })
await rec.close()
console.log("wrote", out)
