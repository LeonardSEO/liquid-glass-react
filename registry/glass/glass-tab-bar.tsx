"use client"

import {
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react"
import { useLiquidGlass } from "@vepando/liquid-glass-react"
import { lensOptics } from "@/registry/glass/glass-lens-thumb"
import { type GlassMaterial, useGlassSurface } from "@/registry/glass/glass-material"
import { createSpring, isSettled, prefersReducedMotion, snapSpring, stepSpring, useAnimationFrames, useIsoLayoutEffect } from "@/registry/glass/glass-spring"

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
export function GlassTabBar({ items, value, onValueChange, material = "bar", className, style, "aria-label": ariaLabel }: GlassTabBarProps) {
  const bar = useGlassSurface<HTMLDivElement>({ material })
  const [current, setCurrent] = useState(value)
  const [size, setSize] = useState({ width: 0, height: 0, slot: 0 })

  const lens = useLiquidGlass({ ...lensOptics(size.height * LENS_HEIGHT), tint: "rgba(255,255,255,0.04)" })

  const root = useRef<HTMLDivElement>(null)
  const base = useRef<HTMLDivElement>(null)
  const accent = useRef<HTMLDivElement>(null)
  const pill = useRef<HTMLSpanElement>(null)
  const lensElement = useRef<HTMLElement | null>(null)
  const metrics = useRef(size)
  // x: the centre of the glass; grow: 0 for the pill at rest, 1 for the lens.
  const x = useRef(createSpring())
  const grow = useRef(createSpring())
  const releasing = useRef(false)
  const drag = useRef<{ pointer: number; startX: number; pressed: number; onActive: boolean; moved: boolean } | null>(null)
  const pendingHref = useRef<string | undefined>(undefined)

  const count = items.length
  const activeIndex = Math.max(0, items.findIndex((item) => item.value === current))
  const activeRef = useRef(activeIndex)
  activeRef.current = activeIndex

  const center = useCallback((index: number) => PAD + metrics.current.slot * (index + 0.5), [])

  const paint = useCallback(() => {
    const { width, height, slot } = metrics.current
    if (!width) return
    const position = x.current.value
    const s = grow.current.value
    const pillHeight = height - PAD * 2
    const lensWidth = slot * LENS_WIDTH
    const lensHeight = height * LENS_HEIGHT
    const rectWidth = mix(slot, lensWidth, s)
    const rectHeight = mix(pillHeight, lensHeight, s)
    const left = position - rectWidth / 2
    const top = (height - rectHeight) / 2

    if (pill.current) {
      pill.current.style.transform = `translate(${position - slot / 2}px, ${PAD}px)`
      pill.current.style.opacity = String(1 - Math.min(1, s * 2.5))
    }
    if (lensElement.current) {
      const element = lensElement.current
      element.style.transform = `translate(${position - lensWidth / 2}px, ${(height - lensHeight) / 2}px) scale(${rectWidth / lensWidth}, ${rectHeight / lensHeight})`
      element.style.opacity = String(Math.min(1, s * 3))
      element.style.visibility = s > 0.01 ? "visible" : "hidden"
    }
    const shape = capsule(left, top, rectWidth, rectHeight)
    if (accent.current) accent.current.style.clipPath = `path("${shape}")`
    if (base.current) base.current.style.clipPath = `path(evenodd, "M${-width} ${-height}H${width * 2}V${height * 2}H${-width}Z${shape}")`
  }, [])

  const settle = useCallback(() => {
    const href = pendingHref.current
    pendingHref.current = undefined
    if (href) window.location.assign(href)
  }, [])

  const frames = useAnimationFrames((dt) => {
    stepSpring(x.current, MOVE, dt)
    stepSpring(grow.current, GROW, dt)
    if (releasing.current && isSettled(x.current, 2, 40)) grow.current.target = 0
    const moving = !isSettled(x.current, 0.4, 4) || !isSettled(grow.current, 0.01, 0.05)
    if (!moving && !drag.current && grow.current.target === 0) {
      snapSpring(x.current)
      snapSpring(grow.current, 0)
      releasing.current = false
      paint()
      settle()
      return false
    }
    paint()
    return true
  })
  const { start, stop } = frames


  useIsoLayoutEffect(() => {
    const element = root.current
    if (!element) return
    const measure = () => {
      const width = element.offsetWidth
      const height = element.offsetHeight
      const next = { width, height, slot: (width - PAD * 2) / count }
      metrics.current = next
      setSize((old) => (old.width === width && old.height === height && old.slot === next.slot ? old : next))
      if (x.current.value === x.current.target && grow.current.value === 0 && !drag.current) {
        snapSpring(x.current, center(activeRef.current))
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
      x.current.target = center(index)
      if (prefersReducedMotion()) {
        stop()
        snapSpring(x.current)
        snapSpring(grow.current, 0)
        releasing.current = false
        paint()
        settle()
        return
      }
      grow.current.target = 1
      releasing.current = true
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
  const rubberBand = (position: number) => {
    const low = center(0)
    const high = center(count - 1)
    if (position < low) return low - (low - position) * 0.25
    if (position > high) return high + (position - high) * 0.25
    return position
  }

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey) return
    if (!metrics.current.slot) return
    event.currentTarget.setPointerCapture(event.pointerId)
    const pointerX = localX(event)
    const pressed = indexAt(pointerX)
    const onActive = pressed === activeRef.current
    drag.current = { pointer: event.pointerId, startX: pointerX, pressed, onActive, moved: false }
    if (prefersReducedMotion()) return
    releasing.current = false
    grow.current.target = 1
    if (onActive) x.current.target = rubberBand(pointerX)
    start()
  }

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const d = drag.current
    if (!d || d.pointer !== event.pointerId) return
    const pointerX = localX(event)
    if (Math.abs(pointerX - d.startX) > DRAG_THRESHOLD) d.moved = true
    if (d.moved || d.onActive) {
      x.current.target = rubberBand(pointerX)
      if (prefersReducedMotion()) {
        snapSpring(x.current)
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
    const target = d.moved ? indexAt(x.current.target) : d.pressed
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
      <div {...bar.rootProps} ref={bar.ref} style={barStyle} aria-hidden="true">
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
