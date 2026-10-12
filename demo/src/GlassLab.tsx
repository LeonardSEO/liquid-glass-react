import { useRef, useState, type CSSProperties, type RefObject } from "react"
import { LiquidGlass } from "@vepando/liquid-glass-react"

const shapes = [
  { name: "Squircle", width: 216, height: 216, radius: 56, x: .55, y: .24 },
  { name: "Orb", width: 132, height: 132, radius: 999, x: .15, y: .67 },
  { name: "Pill", width: 264, height: 96, radius: 999, x: .76, y: .77 },
] as const

type Position = { x: number; y: number }
const clamp = (n: number) => Math.max(0, Math.min(1, n))

function Lens({ shape, stage, blur, refraction, selected, onSelect, compact }: {
  shape: typeof shapes[number]
  stage: RefObject<HTMLDivElement | null>
  blur: number
  refraction: number
  selected: boolean
  onSelect: () => void
  compact: boolean
}) {
  const [position, setPosition] = useState<Position>({ x: shape.x, y: shape.y })
  const [dragging, setDragging] = useState(false)
  const drag = useRef<{ pointer: number; px: number; py: number; position: Position } | null>(null)
  const available = (element: HTMLElement) => ({
    x: Math.max(0, (stage.current?.clientWidth ?? 0) - element.offsetWidth),
    y: Math.max(0, (stage.current?.clientHeight ?? 0) - element.offsetHeight),
  })
  return (
    <button
      type="button"
      className={`lens-handle${selected ? " lens-handle--selected" : ""}${dragging ? " lens-handle--dragging" : ""}`}
      aria-label={`Move ${shape.name.toLowerCase()} lens`}
      aria-describedby="lens-instructions"
      style={{
        "--lens-width": `${shape.width * (compact ? .8 : 1)}px`,
        "--lens-height": `${shape.height * (compact ? .8 : 1)}px`,
        left: `calc(${position.x * 100}% - var(--lens-width) * ${position.x})`,
        top: `calc(${position.y * 100}% - var(--lens-height) * ${position.y})`,
        borderRadius: shape.radius,
      } as CSSProperties}
      onFocus={onSelect}
      onPointerDown={(event) => {
        if (!event.isPrimary || event.button !== 0) return
        event.currentTarget.setPointerCapture(event.pointerId)
        drag.current = { pointer: event.pointerId, px: event.clientX, py: event.clientY, position }
        setDragging(true)
        onSelect()
      }}
      onPointerMove={(event) => {
        const start = drag.current
        if (!start || start.pointer !== event.pointerId) return
        const room = available(event.currentTarget)
        setPosition({
          x: room.x ? clamp(start.position.x + (event.clientX - start.px) / room.x) : 0,
          y: room.y ? clamp(start.position.y + (event.clientY - start.py) / room.y) : 0,
        })
      }}
      onPointerUp={() => { drag.current = null; setDragging(false) }}
      onPointerCancel={() => { drag.current = null; setDragging(false) }}
      onLostPointerCapture={() => { drag.current = null; setDragging(false) }}
      onKeyDown={(event) => {
        const direction: Record<string, Position> = {
          ArrowLeft: { x: -1, y: 0 }, ArrowRight: { x: 1, y: 0 },
          ArrowUp: { x: 0, y: -1 }, ArrowDown: { x: 0, y: 1 },
        }
        const delta = direction[event.key]
        if (!delta) return
        event.preventDefault()
        const room = available(event.currentTarget)
        const step = event.shiftKey ? 30 : 10
        setPosition((p) => ({ x: room.x ? clamp(p.x + delta.x * step / room.x) : 0, y: room.y ? clamp(p.y + delta.y * step / room.y) : 0 }))
      }}
    >
      <LiquidGlass radius={shape.radius} blur={blur} refraction={refraction} tint="rgba(255,255,255,0.06)" className="lens-glass" />
      <span className="lens-caption">{shape.name} <span aria-hidden="true">↗</span></span>
    </button>
  )
}

export function LensCanvas({ hero = false }: { hero?: boolean }) {
  const stage = useRef<HTMLDivElement>(null)
  const [background, setBackground] = useState("grid")
  const [blur, setBlur] = useState(0)
  const [refraction, setRefraction] = useState(1.3)
  const [selected, setSelected] = useState("")
  const [reset, setReset] = useState(0)
  return (
    <>
      {!hero && <div className="lab-tools">
        <fieldset className="surface-picker"><legend>Backdrop</legend>
          {["grid", "ribbons", "type"].map((value) => <button type="button" key={value} aria-pressed={background === value} onClick={() => setBackground(value)}>{value}</button>)}
        </fieldset>
        <label>Refraction <output>{refraction.toFixed(1)}×</output><input aria-label="Refraction" type="range" min="0" max="2.5" step="0.1" value={refraction} onChange={(e) => setRefraction(Number(e.target.value))} /></label>
        <label>Frost <output>{blur}px</output><input aria-label="Frost" type="range" min="0" max="12" step="1" value={blur} onChange={(e) => setBlur(Number(e.target.value))} /></label>
        <button type="button" className="text-button" onClick={() => { setReset((n) => n + 1); setBlur(0); setRefraction(1.3); setSelected("") }}>Reset lenses ↺</button>
      </div>}
      <div ref={stage} className={hero ? "hero-lenses" : `lab-canvas lab-canvas--${background}`} aria-label="Draggable glass canvas">
        {!hero && <div className="lab-art" aria-hidden="true">
          <div className="lab-disc lab-disc--orange" /><div className="lab-disc lab-disc--violet" />
          <span className="lab-edition">THE MATERIAL STUDY / 001</span>
          <div className="lab-type">Liquid<br />in motion.</div>
          <p>Letters bend. Colours split.<br />A different perspective, wherever you move.</p>
          <div className="lab-stripes" />
          <span className="lab-coordinate">Aa Bb Cc &nbsp; 0123456789 &nbsp; ✳</span>
        </div>}
        {shapes.map((shape) => <Lens key={`${reset}-${shape.name}`} shape={shape} stage={stage} blur={blur} refraction={refraction} selected={selected === shape.name} onSelect={() => setSelected(shape.name)} compact={hero} />)}
      </div>
      <p id="lens-instructions" className={hero ? "hero-instructions" : "lab-instructions"}>Drag any shape. Or focus it and use arrow keys; Shift moves faster.{!hero && <span> {selected || "Three shapes"} · live refraction</span>}</p>
    </>
  )
}
