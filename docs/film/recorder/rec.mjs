// Frame-exact recorder for the live demo.
//
// Springs run on requestAnimationFrame, which Playwright's fake clock drives.
// CSS transitions run on the compositor, so every frame pauses them and sets
// their time from the same virtual clock. Each frame is a 2x PNG.
import { chromium } from "playwright"
import { mkdirSync, rmSync } from "node:fs"

export const BASE = "http://localhost:5179/"
const FRAME = 1000 / 30

export async function open(path, { width = 1280, height = 800, scale = 2 } = {}) {
  const browser = await chromium.launch({ channel: "chrome", args: ["--force-color-profile=srgb"] })
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: scale, colorScheme: "light", reducedMotion: "no-preference" })
  const page = await context.newPage()
  await page.addInitScript(() => {
    const births = new WeakMap()
    window.__sync = (now) => {
      for (const animation of document.getAnimations()) {
        if (!births.has(animation)) births.set(animation, now)
        animation.pause()
        animation.currentTime = now - births.get(animation)
      }
    }
  })
  await page.clock.install({ time: new Date("2026-01-01T00:00:00Z") })
  await page.goto(BASE + path, { waitUntil: "networkidle" })
  // Let fonts, images, measurement and the first effects settle.
  await page.clock.runFor(1500)
  await page.waitForTimeout(500)
  let now = 0

  const rec = {
    page,
    browser,
    frames: 0,
    dir: null,
    clip: null,
    /** Starts writing frames of `clip` (CSS px) into `dir`. */
    start(dir, clip) {
      rmSync(dir, { recursive: true, force: true })
      mkdirSync(dir, { recursive: true })
      rec.dir = dir
      rec.clip = clip
      rec.frames = 0
    },
    /** Advances one frame and saves it. */
    async frame() {
      now += FRAME
      await page.clock.runFor(FRAME)
      await page.evaluate((t) => window.__sync(t), now)
      if (rec.dir) {
        const name = String(rec.frames++).padStart(4, "0")
        await page.screenshot({ path: `${rec.dir}/${name}.png`, clip: rec.clip, caret: "initial" })
      }
    },
    /** Holds still for `seconds`, recording. */
    async hold(seconds) {
      for (let i = 0; i < Math.round(seconds * 30); i++) await rec.frame()
    },
    /** Moves the mouse from a to b over `seconds` with an ease, one step per frame. */
    async glide(from, to, seconds, ease = (t) => 0.5 - Math.cos(Math.PI * t) / 2) {
      const n = Math.max(1, Math.round(seconds * 30))
      for (let i = 1; i <= n; i++) {
        const t = ease(i / n)
        await page.mouse.move(from.x + (to.x - from.x) * t, from.y + (to.y - from.y) * t)
        await rec.frame()
      }
    },
    async close() {
      await browser.close()
    },
  }
  return rec
}

export async function center(page, selector) {
  const box = await page.locator(selector).first().boundingBox()
  if (!box) throw new Error(`no box for ${selector}`)
  return { x: box.x + box.width / 2, y: box.y + box.height / 2, box }
}
