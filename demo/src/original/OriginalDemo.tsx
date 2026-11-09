import { Background, DemoNav } from "../Background"
import { numberParam } from "../urlParams"
import { LiquidGlassFilter } from "./LiquidGlassFilter"
import "./liquid-glass.css"

export function OriginalDemo() {
  return (
    <>
      <Background />
      <LiquidGlassFilter mapSrc={`${import.meta.env.BASE_URL}liquid-lens-map.png`} />
      <div style={{ position: "fixed", top: 16, left: 0, right: 0, margin: "0 auto", width: 700, zIndex: 50 }}>
        <div className="liquid-glass" style={{ height: 64, borderRadius: 32 }}>
          <DemoNav />
        </div>
      </div>
      <div className="liquid-glass" style={{ position: "fixed", top: numberParam("ly", 130), left: numberParam("lx", 470), width: 260, height: 260, borderRadius: 60, zIndex: 50 }} />
    </>
  )
}
