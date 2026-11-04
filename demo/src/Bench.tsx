import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { LiquidGlass } from "@vepando/liquid-glass-react"

// Internal measuring page: ?scene=bench&mode=same|varied|dense|panel|move|resize|scroll|nest
// Results land on window.__bench for the Playwright script to read.

type Bench = { buildMs?: number; filters?: number; frames?: number[]; done?: boolean }
declare global {
  interface Window {
    __bench?: Bench
  }
}

const params = new URLSearchParams(location.search)
const mode = params.get("mode") ?? "same"
const FRAMES = 240
const dispersion = params.has("dispersion") ? Number(params.get("dispersion")) : undefined

const background = {
  minHeight: "100vh",
  backgroundImage: "repeating-linear-gradient(45deg, #1b6ca8 0 18px, #f4d35e 18px 36px, #ee6c4d 36px 54px)",
}

function recordFrames(onFrame?: (i: number) => void) {
  const frames: number[] = []
  let last = performance.now()
  let id = 0
  const tick = (now: number) => {
    frames.push(now - last)
    last = now
    onFrame?.(frames.length)
    if (frames.length < FRAMES) id = requestAnimationFrame(tick)
    else window.__bench = { ...window.__bench, frames, done: true }
  }
  id = requestAnimationFrame(tick)
  return () => cancelAnimationFrame(id)
}

function Grid({ varied, tall, dense }: { varied?: boolean; tall?: boolean; dense?: boolean }) {
  const [start] = useState(() => performance.now())
  useLayoutEffect(() => {
    // The maps are built in the synchronous re-render that follows this commit,
    // so the first frame callback is the earliest moment they all exist.
    const id = requestAnimationFrame(() => {
      const filters = document.querySelectorAll(".lg__defs filter").length
      window.__bench = { ...window.__bench, buildMs: performance.now() - start, filters }
      if (!tall) window.__bench.done = true
    })
    return () => cancelAnimationFrame(id)
  }, [start, tall])
  useEffect(() => {
    if (!tall) return
    const max = document.documentElement.scrollHeight - innerHeight
    return recordFrames((i) => window.scrollTo(0, (max * i) / FRAMES))
  }, [tall])
  return (
    <div style={{ ...background, minHeight: dense ? "400vh" : "100vh", display: "flex", flexWrap: "wrap", gap: tall && !dense ? 400 : 12, padding: 24, alignContent: "flex-start" }}>
      {Array.from({ length: 50 }, (_, i) => (
        <LiquidGlass key={i} radius={14} dispersion={dispersion} style={{ position: dense ? "sticky" : undefined, top: 24, width: varied ? 90 + i * 3 : 120, height: varied ? 36 + i : 44 }} />
      ))}
    </div>
  )
}

function Panel() {
  const [start] = useState(() => performance.now())
  useLayoutEffect(() => {
    const id = requestAnimationFrame(() => {
      window.__bench = { buildMs: performance.now() - start, filters: document.querySelectorAll(".lg__defs filter").length, done: true }
    })
    return () => cancelAnimationFrame(id)
  }, [start])
  return (
    <div style={{ ...background, display: "grid", placeItems: "center" }}>
      <LiquidGlass radius={28} style={{ width: 900, height: 600 }} />
    </div>
  )
}

function Moving({ resize }: { resize?: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(
    () =>
      recordFrames((i) => {
        const el = ref.current
        if (!el) return
        const t = i / 30
        if (resize) el.style.width = `${160 + Math.round(Math.sin(t) * 60)}px`
        else el.style.translate = `${Math.round(Math.sin(t) * 300)}px 0`
      }),
    [resize],
  )
  return (
    <div style={{ ...background, display: "grid", placeItems: "center" }}>
      <LiquidGlass ref={ref} radius={22} dispersion={dispersion} style={{ width: 160, height: 44 }} />
    </div>
  )
}

/** Blur differs per variant: if the nested glass sees the page, its pixels change with blur. */
function Nest() {
  const blur = Number(params.get("blur") ?? 0)
  const clear = { blur: 0, refraction: 0, specular: 0, dispersion: 0, tint: "transparent" }
  const inner = { "data-inner": "", radius: 20, blur, refraction: 0, specular: 0, dispersion: 0, tint: "transparent", style: { width: 200, height: 80 } }
  return (
    <div style={{ ...background, display: "flex", gap: 40, padding: 40 }}>
      <LiquidGlass {...clear} data-case="nested" radius={30} style={{ width: 320, height: 200, padding: 40, boxSizing: "border-box" }}>
        <LiquidGlass {...inner} />
      </LiquidGlass>
      <div data-case="sibling" style={{ width: 320, height: 200, padding: 40, boxSizing: "border-box" }}>
        <LiquidGlass {...inner} />
      </div>
    </div>
  )
}

export function Bench() {
  if (mode === "varied") return <Grid varied />
  if (mode === "scroll") return <Grid tall />
  if (mode === "dense") return <Grid tall dense />
  if (mode === "panel") return <Panel />
  if (mode === "move") return <Moving />
  if (mode === "resize") return <Moving resize />
  if (mode === "nest") return <Nest />
  return <Grid />
}
