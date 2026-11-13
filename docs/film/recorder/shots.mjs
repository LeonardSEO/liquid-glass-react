// Records every shot of the README film as PNG frames at 30 fps.
import { center, open } from "./rec.mjs"

const only = process.argv[2]

async function scrollTo(page, selector, offset) {
  await page.locator(selector).evaluate((el, o) => window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - o), offset)
  await page.clock.runFor(500)
  await page.waitForTimeout(300)
}

const shots = {
  // The clear pill lens slides over the headline in the glass lab.
  async lab() {
    const rec = await open("?page=lab", { width: 1280, height: 800, scale: 2 })
    const { page } = rec
    await scrollTo(page, ".lab-canvas", 40)
    const pill = await center(page, '[aria-label="Move pill lens"]')
    rec.start("frames/lab", { x: 96, y: 118, width: 860, height: 484 })
    await page.mouse.move(pill.x, pill.y)
    await rec.hold(0.3)
    await page.mouse.down()
    await rec.hold(0.15)
    await rec.glide(pill, { x: 820, y: 352 }, 0.8)
    await rec.glide({ x: 820, y: 352 }, { x: 330, y: 352 }, 2.3)
    await rec.hold(0.25)
    await page.mouse.up()
    await rec.hold(0.5)
    return rec
  },

  // Hold Wi-Fi: the capsule lifts into glass; let go: it slides off. Then a quick tap.
  async switch() {
    const rec = await open("?page=showcase", { width: 1280, height: 800, scale: 4 })
    const { page } = rec
    await scrollTo(page, ".settings-panel", 120)
    const wifi = await center(page, '.settings-panel [aria-label="Wi-Fi"]')
    const plane = await center(page, '.settings-panel [aria-label="Airplane Mode"]')
    // The four switch rows, edge to edge of the panel.
    rec.start("frames/switch", { x: 680, y: 162, width: 390, height: 219 })
    await page.mouse.move(wifi.x + 8, wifi.y)
    await rec.hold(0.3)
    await page.mouse.down()
    await rec.hold(0.8)
    await page.mouse.up()
    await rec.hold(0.7)
    await page.mouse.move(plane.x - 8, plane.y)
    await rec.hold(0.2)
    await page.mouse.down()
    await rec.hold(0.08)
    await page.mouse.up()
    await rec.hold(0.9)
    return rec
  },

  // Drag the brightness thumb past the end, so the track stretches, and back.
  async slider() {
    const rec = await open("?page=showcase", { width: 1280, height: 800, scale: 4 })
    const { page } = rec
    await scrollTo(page, ".settings-panel", 120)
    const thumb = await center(page, ".settings-panel [role=slider] .glass-lens-thumb")
    // Two rows above the slider, and room on the right for the stretch.
    rec.start("frames/slider", { x: 684, y: 230, width: 400, height: 225 })
    await page.mouse.move(thumb.x, thumb.y)
    await rec.hold(0.3)
    await page.mouse.down()
    await rec.hold(0.25)
    await rec.glide(thumb, { x: 1075, y: thumb.y }, 1.0)
    await rec.hold(0.35)
    await rec.glide({ x: 1075, y: thumb.y }, { x: 790, y: thumb.y }, 0.9)
    await rec.hold(0.15)
    await page.mouse.up()
    await rec.hold(0.6)
    return rec
  },

  // The tabs button grows into a menu, then shrinks back into the button.
  async menu() {
    const rec = await open("?page=showcase", { width: 1280, height: 800, scale: 4 })
    const { page } = rec
    await scrollTo(page, ".browser-scene", 120)
    const tabs = await center(page, '.browser-scene [aria-label="Tabs"]')
    rec.start("frames/menu", { x: 667, y: 412, width: 420, height: 236 })
    await page.mouse.move(tabs.x, tabs.y)
    await rec.hold(0.35)
    // A plain click: the menu opens on press, and a release after a pause would count again.
    await page.mouse.down()
    await page.mouse.up()
    await rec.hold(0.95)
    const item = await center(page, '[role=menuitem]:has-text("New Private Tab")')
    await rec.glide({ x: tabs.x, y: tabs.y }, item, 0.5)
    await rec.hold(0.5)
    await page.keyboard.press("Escape")
    await rec.hold(0.9)
    return rec
  },
}

for (const [name, shot] of Object.entries(shots)) {
  if (only && only !== name) continue
  const started = Date.now()
  const rec = await shot()
  console.log(`${name}: ${rec.frames} frames in ${Math.round((Date.now() - started) / 1000)}s`)
  await rec.close()
}
