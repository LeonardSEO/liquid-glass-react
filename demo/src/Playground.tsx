import { useRef, useState } from "react"
import { LiquidGlass } from "@vepando/liquid-glass-react"
import { Background, DemoNav } from "./Background"
import { glassOverrides, numberParam } from "./urlParams"

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

export function Playground() {
  return (
    <>
      <Background />
      <div style={{ position: "fixed", top: 16, left: 0, right: 0, margin: "0 auto", width: "min(700px, calc(100% - 32px))", zIndex: 50 }}>
        <LiquidGlass variant="clear" radius={32} style={{ height: 64 }} {...glassOverrides}>
          <DemoNav />
        </LiquidGlass>
      </div>
      <Draggable x={numberParam("lx", 470)} y={numberParam("ly", 130)}>
        <LiquidGlass variant="clear" radius={numberParam("radius", 60)} interactive style={{ width: numberParam("lw", 260), height: numberParam("lh", 260) }} {...glassOverrides} />
      </Draggable>
      <Draggable x={80} y={440}>
        <LiquidGlass variant="clear" radius={999} interactive style={{ width: 120, height: 120 }} {...glassOverrides} />
      </Draggable>
    </>
  )
}
