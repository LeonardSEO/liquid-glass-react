import { useRef, useState, type CSSProperties, type RefObject } from "react"
import { type GlassVariant, LiquidGlass } from "@vepando/liquid-glass-react"
import "./website.css"

const styles: GlassVariant[] = ["regular", "clear", "identity"]
const tints = [["None", undefined], ["Blue", "rgba(10,132,255,0.35)"], ["Red", "rgba(255,69,58,0.35)"]] as const
const MAX_RADIUS = 120

const shapes = [
  { name: "Squircle", width: 216, height: 216, radius: 56, x: .55, y: .24 },
  { name: "Orb", width: 132, height: 132, radius: 999, x: .15, y: .67 },
  { name: "Pill", width: 264, height: 96, radius: 999, x: .76, y: .77 },
] as const

type Position = { x: number; y: number }
const clamp = (n: number) => Math.max(0, Math.min(1, n))

function Lens({ shape, stage, variant, tint, interactive, radius, selected, onSelect, compact }: {
  shape: typeof shapes[number]
  stage: RefObject<HTMLDivElement | null>
  variant: GlassVariant
  tint?: string
  interactive: boolean
  radius: number
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
        "--lens-base-width": `${shape.width * (compact ? .8 : 1)}px`,
        "--lens-base-height": `${shape.height * (compact ? .8 : 1)}px`,
        left: `calc(${position.x * 100}% - var(--lens-width) * ${position.x})`,
        top: `calc(${position.y * 100}% - var(--lens-height) * ${position.y})`,
        borderRadius: Math.min(shape.radius, radius),
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
      <LiquidGlass variant={variant} tint={tint} interactive={interactive} radius={Math.min(shape.radius, radius)} className="lens-glass" />
      <span className="lens-caption">{variant}</span>
    </button>
  )
}

export function LensCanvas({ hero = false }: { hero?: boolean }) {
  const stage = useRef<HTMLDivElement>(null)
  const [background, setBackground] = useState("light")
  const [variant, setVariant] = useState<GlassVariant>("clear")
  const [tint, setTint] = useState<string | undefined>(undefined)
  const [interactive, setInteractive] = useState(true)
  const [radius, setRadius] = useState(MAX_RADIUS)
  const [selected, setSelected] = useState("")
  const [reset, setReset] = useState(0)
  return (
    <>
      {!hero && <div className="lab-tools">
        <fieldset className="surface-picker"><legend>Backdrop</legend>
          {["light", "dark", "type"].map((value) => <button type="button" key={value} aria-pressed={background === value} onClick={() => setBackground(value)}>{value}</button>)}
        </fieldset>
        <fieldset className="surface-picker"><legend>Style</legend>
          {styles.map((value) => <button type="button" key={value} aria-pressed={variant === value} onClick={() => setVariant(value)}>{value}</button>)}
        </fieldset>
        <fieldset className="surface-picker"><legend>Tint</legend>
          {tints.map(([name, value]) => <button type="button" key={name} aria-pressed={tint === value} onClick={() => setTint(value)}>{name}</button>)}
        </fieldset>
        <fieldset className="surface-picker"><legend>Interactive</legend>
          <button type="button" aria-pressed={interactive} onClick={() => setInteractive((on) => !on)}>{interactive ? "On" : "Off"}</button>
        </fieldset>
        <label>Corner radius <output>{radius === MAX_RADIUS ? "Auto" : `${radius}px`}</output><input aria-label="Corner radius" type="range" min="0" max={MAX_RADIUS} step="2" value={radius} onChange={(e) => setRadius(Number(e.target.value))} /></label>
        <button type="button" className="text-button" onClick={() => { setReset((n) => n + 1); setVariant("clear"); setTint(undefined); setInteractive(true); setRadius(MAX_RADIUS); setSelected("") }}>Reset</button>
      </div>}
      <div ref={stage} className={hero ? "hero-lenses" : `lab-canvas lab-canvas--${background}`} aria-label="Draggable glass canvas">
        {!hero && <div className="lab-art" aria-hidden="true">
          <span className="lab-edition">Material study</span>
          <div className="lab-type">Liquid<br />in motion</div>
          <p>Regular, or clear. Tinted, or not.<br />A different light, wherever you move.</p>
          <div className="lab-stripes" />
          <span className="lab-coordinate">Aa Bb Cc &nbsp; 0123456789 &nbsp; ✳</span>
        </div>}
        {shapes.map((shape) => <Lens key={`${reset}-${shape.name}`} shape={shape} stage={stage} variant={variant} tint={tint} interactive={interactive} radius={radius} selected={selected === shape.name} onSelect={() => setSelected(shape.name)} compact={hero} />)}
      </div>
      <p id="lens-instructions" className={hero ? "hero-instructions" : "lab-instructions"}>Drag any shape. Or focus it and use arrow keys; Shift moves faster.{!hero && <span> {selected || "Three shapes"} · live glass</span>}</p>
    </>
  )
}
