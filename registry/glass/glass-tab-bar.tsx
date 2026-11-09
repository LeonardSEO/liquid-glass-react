"use client"

import {
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react"
import { useLiquidGlass } from "@vepando/liquid-glass-react"
import { type GlassMaterial, useGlassSurface } from "@/registry/glass/glass-material"

export type GlassTabBarItem = {
  value: string
  label: ReactNode
  icon?: ReactNode
  /** Renders a link and navigates to it once the glass has settled. */
  href?: string
}

export type GlassTabBarProps = {
  items: GlassTabBarItem[]
  value: string
  onValueChange?: (value: string) => void
  material?: GlassMaterial
  className?: string
  style?: CSSProperties
  "aria-label": string
}

const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect

const PAD = 4
const LENS_WIDTH = 1.2
const LENS_HEIGHT = 1.18
const DRAG_THRESHOLD = 6
const MOVE = { stiffness: 420, damping: 30 }
const GROW = { stiffness: 380, damping: 26 }

const mix = (a: number, b: number, t: number) => a + (b - a) * t

function capsule(left: number, top: number, width: number, height: number) {
  const r = height / 2
  const right = left + width
  const bottom = top + height
  return `M${left + r} ${top}H${right - r}A${r} ${r} 0 0 1 ${right - r} ${bottom}H${left + r}A${r} ${r} 0 0 1 ${left + r} ${top}Z`
}

function ItemContent({ item }: { item: GlassTabBarItem }) {
  return (
    <>
      {item.icon}
      <span>{item.label}</span>
    </>
  )
}

/**
 * A tab bar in the style of iOS: a quiet pill at rest, and a magnifying lens
 * that rises out of the bar while it is touched or travelling.
 *
 * The lens is a sibling painted over the bar, because glass nested in glass
 * has no backdrop to bend. Labels are drawn twice: the normal copy has a hole
 * where the lens is, and an accent copy shows only inside it.
 */
export function GlassTabBar({ items, value, onValueChange, material = "regular", className, style, "aria-label": ariaLabel }: GlassTabBarProps) {
  const bar = useGlassSurface<HTMLDivElement>({ material })
  const lens = useLiquidGlass({ variant: "lens", blur: 0, dispersion: 0.14, tint: "rgba(255,255,255,0.04)", radius: "auto" })

  const [current, setCurrent] = useState(value)
  const [size, setSize] = useState({ width: 0, height: 0, slot: 0 })

  const root = useRef<HTMLDivElement>(null)
  const base = useRef<HTMLDivElement>(null)
  const accent = useRef<HTMLDivElement>(null)
  const pill = useRef<HTMLSpanElement>(null)
  const lensElement = useRef<HTMLElement | null>(null)
  const metrics = useRef(size)
  const physics = useRef({ x: 0, vx: 0, tx: 0, s: 0, vs: 0, ts: 0, releasing: false })
  const drag = useRef<{ pointer: number; startX: number; pressed: number; onActive: boolean; moved: boolean } | null>(null)
  const frame = useRef(0)
  const lastTime = useRef(0)
  const pendingHref = useRef<string | undefined>(undefined)

  const count = items.length
  const activeIndex = Math.max(0, items.findIndex((item) => item.value === current))
  const activeRef = useRef(activeIndex)
  activeRef.current = activeIndex

  const center = useCallback((index: number) => PAD + metrics.current.slot * (index + 0.5), [])
  const reducedMotion = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches

  const paint = useCallback(() => {
    const { width, height, slot } = metrics.current
    if (!width) return
    const { x, s } = physics.current
    const pillHeight = height - PAD * 2
    const lensWidth = slot * LENS_WIDTH
    const lensHeight = height * LENS_HEIGHT
    const rectWidth = mix(slot, lensWidth, s)
    const rectHeight = mix(pillHeight, lensHeight, s)
    const left = x - rectWidth / 2
    const top = (height - rectHeight) / 2

    if (pill.current) {
      pill.current.style.transform = `translate(${x - slot / 2}px, ${PAD}px)`
      pill.current.style.opacity = String(1 - Math.min(1, s * 2.5))
    }
    if (lensElement.current) {
      const element = lensElement.current
      element.style.transform = `translate(${x - lensWidth / 2}px, ${(height - lensHeight) / 2}px) scale(${rectWidth / lensWidth}, ${rectHeight / lensHeight})`
      element.style.opacity = String(Math.min(1, s * 3))
      element.style.visibility = s > 0.01 ? "visible" : "hidden"
    }
    const shape = capsule(left, top, rectWidth, rectHeight)
    if (accent.current) accent.current.style.clipPath = `path("${shape}")`
    if (base.current) base.current.style.clipPath = `path(evenodd, "M${-width} ${-height}H${width * 2}V${height * 2}H${-width}Z${shape}")`
  }, [])

  const stop = useCallback(() => {
    cancelAnimationFrame(frame.current)
    frame.current = 0
  }, [])

  const settle = useCallback(() => {
    const href = pendingHref.current
    pendingHref.current = undefined
    if (href) window.location.assign(href)
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
      if (p.releasing && Math.abs(p.x - p.tx) < 2 && Math.abs(p.vx) < 40) p.ts = 0
      const moving = Math.abs(p.x - p.tx) > 0.4 || Math.abs(p.vx) > 4 || Math.abs(p.s - p.ts) > 0.01 || Math.abs(p.vs) > 0.05
      if (!moving && !drag.current && p.ts === 0) {
        p.x = p.tx
        p.vx = 0
        p.s = 0
        p.vs = 0
        p.releasing = false
        paint()
        frame.current = 0
        settle()
        return
      }
      paint()
      frame.current = requestAnimationFrame(tick)
    },
    [paint, settle],
  )

  const start = useCallback(() => {
    if (frame.current) return
    lastTime.current = performance.now()
    frame.current = requestAnimationFrame(tick)
  }, [tick])

  useEffect(() => stop, [stop])

  useIsoLayoutEffect(() => {
    const element = root.current
    if (!element) return
    const measure = () => {
      const width = element.offsetWidth
      const height = element.offsetHeight
      const next = { width, height, slot: (width - PAD * 2) / count }
      metrics.current = next
      setSize((old) => (old.width === width && old.height === height ? old : next))
      const p = physics.current
      if (!frame.current && !drag.current) {
        p.tx = p.x = center(activeRef.current)
        paint()
      }
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [center, count, paint])

  // Runs after size changes too: the lens element only then has its final box.
  useIsoLayoutEffect(paint, [paint, size])

  const moveTo = useCallback(
    (index: number) => {
      const p = physics.current
      p.tx = center(index)
      if (reducedMotion()) {
        stop()
        p.x = p.tx
        p.vx = p.s = p.vs = p.ts = 0
        p.releasing = false
        paint()
        settle()
        return
      }
      p.ts = 1
      p.releasing = true
      start()
    },
    [center, paint, settle, start, stop],
  )

  useEffect(() => {
    if (value === current || drag.current) return
    setCurrent(value)
    moveTo(Math.max(0, items.findIndex((item) => item.value === value)))
    // Only an outside change of `value` should move the glass.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  const select = (index: number, navigate: boolean) => {
    const item = items[index]
    if (item.value !== current) {
      setCurrent(item.value)
      onValueChange?.(item.value)
      if (navigate) pendingHref.current = item.href
    }
    moveTo(index)
  }

  const localX = (event: PointerEvent<HTMLDivElement>) => event.clientX - event.currentTarget.getBoundingClientRect().left
  const indexAt = (x: number) => Math.max(0, Math.min(count - 1, Math.floor((x - PAD) / metrics.current.slot)))
  const rubberBand = (x: number) => {
    const low = center(0)
    const high = center(count - 1)
    if (x < low) return low - (low - x) * 0.25
    if (x > high) return high + (x - high) * 0.25
    return x
  }

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey) return
    if (!metrics.current.slot) return
    event.currentTarget.setPointerCapture?.(event.pointerId)
    const x = localX(event)
    const pressed = indexAt(x)
    const onActive = pressed === activeRef.current
    drag.current = { pointer: event.pointerId, startX: x, pressed, onActive, moved: false }
    if (reducedMotion()) return
    const p = physics.current
    p.releasing = false
    p.ts = 1
    if (onActive) p.tx = rubberBand(x)
    start()
  }

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const d = drag.current
    if (!d || d.pointer !== event.pointerId) return
    const x = localX(event)
    if (Math.abs(x - d.startX) > DRAG_THRESHOLD) d.moved = true
    if (d.moved || d.onActive) {
      physics.current.tx = rubberBand(x)
      if (reducedMotion()) {
        physics.current.x = physics.current.tx
        paint()
      }
    }
  }

  const finishDrag = (event: PointerEvent<HTMLDivElement>, cancelled: boolean) => {
    const d = drag.current
    if (!d || d.pointer !== event.pointerId) return
    drag.current = null
    if (cancelled) {
      moveTo(activeRef.current)
      return
    }
    const target = d.moved ? indexAt(physics.current.tx) : d.pressed
    select(target, true)
  }

  // A real pointer was handled above and navigates once the glass has settled.
  // Keyboard activation reports detail 0 and follows the link natively.
  const onClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.detail > 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey) event.preventDefault()
  }

  const onTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const delta = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0
    const target = event.key === "Home" ? 0 : event.key === "End" ? count - 1 : delta ? (index + delta + count) % count : -1
    if (target < 0) return
    event.preventDefault()
    select(target, false)
    const tabs = event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]')
    tabs?.[target]?.focus()
  }

  const links = items.some((item) => item.href)
  const columns: CSSProperties = { display: "grid", gridTemplateColumns: `repeat(${count}, 1fr)`, padding: PAD }

  const list = items.map((item, index) => {
    if (links) {
      return (
        <a key={item.value} className="glass-tab-bar__item" href={item.href} draggable={false} aria-current={item.value === current ? "page" : undefined}>
          <ItemContent item={item} />
        </a>
      )
    }
    const selected = item.value === current
    return (
      <button
        key={item.value}
        type="button"
        className="glass-tab-bar__item"
        role="tab"
        aria-selected={selected}
        tabIndex={selected ? 0 : -1}
        onClick={(event) => {
          if (event.detail === 0) select(index, false)
        }}
        onKeyDown={(event) => onTabKeyDown(event, index)}
      >
        <ItemContent item={item} />
      </button>
    )
  })

  const lensRef = lens.ref
  const setLens = useCallback(
    (element: HTMLElement | null) => {
      lensElement.current = element
      lensRef(element)
    },
    [lensRef],
  )

  const { width, height, slot } = size
  const barStyle: CSSProperties = { ...bar.rootProps.style, position: "absolute", inset: 0, borderRadius: 9999 }
  const lensStyle: CSSProperties = {
    ...lens.rootProps.style,
    position: "absolute",
    top: 0,
    left: 0,
    width: slot * LENS_WIDTH || undefined,
    height: height * LENS_HEIGHT || undefined,
    borderRadius: 9999,
    transformOrigin: "50% 50%",
    transition: "none",
    pointerEvents: "none",
    visibility: "hidden",
    zIndex: 2,
  }

  return (
    <div
      ref={root}
      className={["glass-tab-bar", className].filter(Boolean).join(" ")}
      style={style}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={(event) => finishDrag(event, false)}
      onPointerCancel={(event) => finishDrag(event, true)}
      onClick={onClick}
    >
      <div {...bar.rootProps} ref={bar.ref} className={`${bar.rootProps.className} glass-bar`} style={barStyle} aria-hidden="true">
        {bar.wrap()}
      </div>
      <span ref={pill} className="glass-tab-bar__pill" aria-hidden="true" style={{ width: slot || undefined, height: height ? height - PAD * 2 : undefined }} />
      <div ref={base} className="glass-tab-bar__base">
        {links ? (
          <nav aria-label={ariaLabel} style={columns}>
            {list}
          </nav>
        ) : (
          <div role="tablist" aria-label={ariaLabel} style={columns}>
            {list}
          </div>
        )}
      </div>
      <span {...lens.rootProps} ref={setLens} style={lensStyle} aria-hidden="true">
        {lens.wrap()}
      </span>
      <div ref={accent} className="glass-tab-bar__accent" aria-hidden="true" style={{ ...columns, width: width || undefined, clipPath: "inset(100%)" }}>
        {items.map((item) => (
          <span key={item.value} className="glass-tab-bar__item">
            <ItemContent item={item} />
          </span>
        ))}
      </div>
    </div>
  )
}
