import { useRef, useState } from "react"
import { Background } from "./Background"
import { LiquidGlass } from "@vepando/liquid-glass-react"
import { LiquidGlassFilter } from "./original/LiquidGlassFilter"
import { overrides } from "./Scenes"
import "./original/liquid-glass.css"

const params = new URLSearchParams(location.search)
const num = (k: string, d: number) => (params.has(k) ? Number(params.get(k)) : d)

function Draggable({ x, y, children }: { x: number; y: number; children: React.ReactNode }) {
  const [pos, setPos] = useState({ x, y })
  const start = useRef<{ px: number; py: number; x: number; y: number } | null>(null)
  return (
    <div
      style={{ position: "fixed", left: pos.x, top: pos.y, zIndex: 60, touchAction: "none" }}
      onPointerDown={(e) => {
        ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
        start.current = { px: e.clientX, py: e.clientY, x: pos.x, y: pos.y }
      }}
      onPointerMove={(e) => {
        const s = start.current
        if (s) setPos({ x: s.x + e.clientX - s.px, y: s.y + e.clientY - s.py })
      }}
      onPointerUp={() => (start.current = null)}
    >
      {children}
    </div>
  )
}

const navStyle = { height: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px" } as const

export function Playground() {
  const original = params.get("scene") === "original"
  return (
    <>
      <Background />
      {original ? (
        <>
          <LiquidGlassFilter mapSrc="/liquid-lens-map.png" />
          <div style={{ position: "fixed", top: 16, left: 0, right: 0, margin: "0 auto", width: 700, zIndex: 50 }}>
            <nav className="liquid-glass" style={{ ...navStyle, height: 64, borderRadius: 32 }}>
              <b>Your Logo</b><span>Features · Pricing · About</span><span>Get started</span>
            </nav>
          </div>
          <div className="liquid-glass" style={{ position: "fixed", top: num("ly", 130), left: num("lx", 470), width: 260, height: 260, borderRadius: 60, zIndex: 50 }} />
        </>
      ) : (
        <>
          <div style={{ position: "fixed", top: 16, left: 0, right: 0, margin: "0 auto", width: "min(700px, calc(100% - 32px))", zIndex: 50 }}>
            <LiquidGlass radius={32} style={{ height: 64 }} {...overrides}>
              <nav style={navStyle}><b>Your Logo</b><span>Features · Pricing · About</span><span>Get started</span></nav>
            </LiquidGlass>
          </div>
          <Draggable x={num("lx", 470)} y={num("ly", 130)}>
            <LiquidGlass radius={num("radius", 60)} interactive style={{ width: num("lw", 260), height: num("lh", 260) }} {...overrides} />
          </Draggable>
          <Draggable x={80} y={440}>
            <LiquidGlass radius={999} interactive style={{ width: 120, height: 120 }} {...overrides} />
          </Draggable>
        </>
      )}
    </>
  )
}
