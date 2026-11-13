"use client"

import {
  type ButtonHTMLAttributes,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  forwardRef,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react"
import { useLiquidGlass } from "@vepando/liquid-glass-react"
import "@/registry/glass/glass-material"

export type GlassSwitchProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "value" | "defaultValue" | "onChange" | "role" | "type"> & {
  checked?: boolean
  defaultChecked?: boolean
  onCheckedChange?: (checked: boolean) => void
  /** Submits the switch with a form under this name while it is on. */
  name?: string
  /** The value submitted while the switch is on. Default: "on". */
  value?: string
}

const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect

// Measured on iOS 26 in points: a 63 × 28 track, a 37 × 24 capsule at rest
// that grows into a 54 × 35 lens while touched.
const TRACK_WIDTH = 63
const TRACK_HEIGHT = 28
const INSET = 2
const LENS_WIDTH = 54
const LENS_HEIGHT = 35
const REST_SCALE = (TRACK_HEIGHT - INSET * 2) / LENS_HEIGHT
const REST_WIDTH = LENS_WIDTH * REST_SCALE
const OFF_X = INSET + REST_WIDTH / 2
const ON_X = TRACK_WIDTH - OFF_X
const MOVE = { stiffness: 520, damping: 34 }
const GROW = { stiffness: 420, damping: 28 }

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
const reducedMotion = () => typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches

/**
 * An iOS 26 switch: a white capsule at rest that turns into a clear glass
 * lens as soon as it is pressed, magnifying the track beneath it. It stays
 * glass while held, toggles on release and turns white again once it lands.
 *
 * The lens is a sibling painted over the track, so its backdrop is the track
 * and the page around it. Its box has the size of the touched lens and is
 * scaled down at rest, which keeps the refraction maps the same while it grows.
 */
export const GlassSwitch = forwardRef<HTMLButtonElement, GlassSwitchProps>(function GlassSwitch(
  { checked: checkedProp, defaultChecked = false, onCheckedChange, name, value = "on", disabled, className, style, onPointerDown, onKeyDown, onClick, ...props },
  forwardedRef,
) {
  const lens = useLiquidGlass({ variant: "lens", blur: 0, saturation: 1.1, dispersion: 0, bezel: 6, thickness: 12, refraction: 1.2, tint: "rgba(255,255,255,0)", radius: "auto" })

  const [uncontrolled, setUncontrolled] = useState(defaultChecked)
  const checked = checkedProp ?? uncontrolled
  // What the track shows: changes as the thumb sets off, not when it lands.
  const [shown, setShown] = useState(checked)

  const thumb = useRef<HTMLElement | null>(null)
  const knob = useRef<HTMLSpanElement>(null)
  const glow = useRef<HTMLSpanElement>(null)
  const physics = useRef({ x: checked ? ON_X : OFF_X, vx: 0, tx: checked ? ON_X : OFF_X, s: 0, vs: 0, ts: 0, releasing: false })
  const press = useRef<number | null>(null)
  const frame = useRef(0)
  const lastTime = useRef(0)
  const checkedRef = useRef(checked)
  checkedRef.current = checked

  const paint = useCallback(() => {
    const { x, s } = physics.current
    const scale = REST_SCALE + (1 - REST_SCALE) * s
    const transform = `translate(${x - LENS_WIDTH / 2}px, ${(TRACK_HEIGHT - LENS_HEIGHT) / 2}px) scale(${scale})`
    if (thumb.current) thumb.current.style.transform = transform
    if (glow.current) {
      glow.current.style.transform = transform
      glow.current.style.opacity = String(clamp(s, 0, 1))
    }
    if (knob.current) knob.current.style.opacity = String(clamp(1 - s * 1.8, 0, 1))
  }, [])

  const tick = useCallback(
    (now: number) => {
      const p = physics.current
      const dt = Math.min(0.032, (now - lastTime.current) / 1000 || 0.016)
      lastTime.current = now
      for (let i = 0; i < 2; i++) {
        const h = dt / 2
        p.vx += (-MOVE.stiffness * (p.x - p.tx) - MOVE.damping * p.vx) * h
        p.x += p.vx * h
        p.vs += (-GROW.stiffness * (p.s - p.ts) - GROW.damping * p.vs) * h
        p.s += p.vs * h
      }
      if (p.releasing && Math.abs(p.x - p.tx) < 1.5 && Math.abs(p.vx) < 30) p.ts = 0
      const moving = Math.abs(p.x - p.tx) > 0.2 || Math.abs(p.vx) > 2 || Math.abs(p.s - p.ts) > 0.005 || Math.abs(p.vs) > 0.05
      if (!moving && p.ts === 0) {
        p.x = p.tx
        p.vx = p.s = p.vs = 0
        p.releasing = false
        paint()
        frame.current = 0
        return
      }
      paint()
      frame.current = requestAnimationFrame(tick)
    },
    [paint],
  )

  const start = useCallback(() => {
    if (frame.current) return
    lastTime.current = performance.now()
    frame.current = requestAnimationFrame(tick)
  }, [tick])

  useEffect(
    () => () => {
      cancelAnimationFrame(frame.current)
    },
    [],
  )
  useIsoLayoutEffect(paint, [paint])

  /** Sends the thumb to a side. `lift` turns it into glass on the way; a lens shrinks back once it lands. */
  const settle = useCallback(
    (on: boolean, lift = false) => {
      const p = physics.current
      p.tx = on ? ON_X : OFF_X
      setShown(on)
      if (reducedMotion()) {
        cancelAnimationFrame(frame.current)
        frame.current = 0
        p.x = p.tx
        p.vx = p.s = p.vs = p.ts = 0
        p.releasing = false
        paint()
        return
      }
      if (lift) p.ts = 1
      p.releasing = true
      start()
    },
    [paint, start],
  )

  // An outside change of `checked` moves the thumb.
  useEffect(() => {
    if (physics.current.tx !== (checked ? ON_X : OFF_X)) settle(checked)
    else setShown(checked)
  }, [checked, settle])

  const commit = (next: boolean) => {
    if (next !== checkedRef.current) {
      if (checkedProp === undefined) setUncontrolled(next)
      onCheckedChange?.(next)
    }
    settle(next, true)
  }

  const handlePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    onPointerDown?.(event)
    if (event.defaultPrevented || disabled || event.button !== 0) return
    event.currentTarget.setPointerCapture(event.pointerId)
    press.current = event.pointerId
    if (reducedMotion()) return
    const p = physics.current
    p.releasing = false
    p.ts = 1
    start()
  }

  const handlePointerUp = (event: PointerEvent<HTMLButtonElement>, cancelled: boolean) => {
    if (press.current !== event.pointerId) return
    press.current = null
    if (cancelled) settle(checkedRef.current)
    else commit(!checkedRef.current)
  }

  // Pointers are handled above; a click with detail 0 comes from the keyboard
  // or assistive technology.
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    onClick?.(event)
    if (event.defaultPrevented || disabled || event.detail > 0) return
    commit(!checkedRef.current)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    onKeyDown?.(event)
    // A switch toggles on Space only; Enter would submit a surrounding form.
    if (event.key === "Enter") event.preventDefault()
  }

  const lensRef = lens.ref
  const setThumb = useCallback(
    (element: HTMLElement | null) => {
      thumb.current = element
      lensRef(element)
    },
    [lensRef],
  )

  const thumbStyle: CSSProperties = {
    ...lens.rootProps.style,
    width: LENS_WIDTH,
    height: LENS_HEIGHT,
  }

  return (
    <button
      {...props}
      ref={forwardedRef}
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      data-checked={shown ? "" : undefined}
      className={["glass-switch", className].filter(Boolean).join(" ")}
      style={style}
      onPointerDown={handlePointerDown}
      onPointerUp={(event) => handlePointerUp(event, false)}
      onPointerCancel={(event) => handlePointerUp(event, true)}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      <span className="glass-switch__track" aria-hidden="true" />
      <span ref={glow} className="glass-switch__glow" aria-hidden="true" />
      <span {...lens.rootProps} ref={setThumb} className={`${lens.rootProps.className} glass-switch__thumb`} style={thumbStyle} aria-hidden="true">
        {lens.wrap(<span ref={knob} className="glass-switch__knob" />)}
      </span>
      {name !== undefined && checked && <input type="hidden" name={name} value={value} />}
    </button>
  )
})
