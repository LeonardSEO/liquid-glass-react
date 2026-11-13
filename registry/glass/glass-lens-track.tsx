"use client"

import { type CSSProperties, type PointerEvent, type ReactNode, useCallback, useEffect, useRef, useState } from "react"
import { useLiquidGlass } from "@vepando/liquid-glass-react"
import { lensOptics } from "@/registry/glass/glass-lens-thumb"
import { createSpring, isSettled, prefersReducedMotion, snapSpring, stepSpring, useAnimationFrames, useIsoLayoutEffect } from "@/registry/glass/glass-spring"

export type LensTrackOptions = {
  /** Number of equal slots. */
  count: number
  /** The selected slot. */
  activeIndex: number
  /**
   * A pointer picked a slot, by tapping it or by dragging the glass onto it.
   * Return another index to send the glass there instead, such as the
   * current one when the picked slot is disabled.
   */
  onPick: (index: number) => number | void
  /** The glass has come to rest. */
  onSettle?: () => void
  /** Inset of the slots from the edge, in px. Default 4. */
  pad?: number
  /** Size of the lens as a share of a slot's width and the track's height. */
  lensWidth?: number
  lensHeight?: number
  tint?: string
}

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

/**
 * A row of slots with a selection that rises into a magnifying glass lens
 * while it is touched or travelling, as in iOS 26 tab bars and segmented
 * controls. A quiet pill marks the selection at rest.
 *
 * Attach `rootRef` and `rootProps` to a positioned element, and give it the
 * pill, a `base` layer with the items, `lens` and an `accent` copy of the
 * items. The lens is a sibling painted over the items, because glass nested
 * in glass has no backdrop to bend. The base layer gets a hole where the lens
 * is and the accent copy shows only inside it, so labels under the lens stay
 * sharp.
 */
export function useLensTrack({ count, activeIndex, onPick, onSettle, pad = 4, lensWidth = 1.2, lensHeight = 1.18, tint = "rgba(255,255,255,0.04)" }: LensTrackOptions) {
  const [size, setSize] = useState({ width: 0, height: 0, slot: 0 })
  const lens = useLiquidGlass({ ...lensOptics(size.height * lensHeight), tint })

  const rootRef = useRef<HTMLDivElement>(null)
  const baseRef = useRef<HTMLDivElement>(null)
  const accentRef = useRef<HTMLDivElement>(null)
  const pillRef = useRef<HTMLSpanElement>(null)
  const lensElement = useRef<HTMLElement | null>(null)
  const metrics = useRef(size)
  // x: the centre of the glass; grow: 0 for the pill at rest, 1 for the lens.
  const x = useRef(createSpring())
  const grow = useRef(createSpring())
  const releasing = useRef(false)
  const drag = useRef<{ pointer: number; startX: number; pressed: number; onActive: boolean; moved: boolean } | null>(null)

  const activeRef = useRef(activeIndex)
  activeRef.current = activeIndex
  const callbacks = useRef({ onPick, onSettle })
  callbacks.current = { onPick, onSettle }

  const center = useCallback((index: number) => pad + metrics.current.slot * (index + 0.5), [pad])

  const paint = useCallback(() => {
    const { width, height, slot } = metrics.current
    if (!width) return
    const position = x.current.value
    const s = grow.current.value
    const pillHeight = height - pad * 2
    const fullWidth = slot * lensWidth
    const fullHeight = height * lensHeight
    const rectWidth = mix(slot, fullWidth, s)
    const rectHeight = mix(pillHeight, fullHeight, s)
    const left = position - rectWidth / 2
    const top = (height - rectHeight) / 2

    if (pillRef.current) {
      pillRef.current.style.transform = `translate(${position - slot / 2}px, ${pad}px)`
      pillRef.current.style.opacity = String(1 - Math.min(1, s * 2.5))
    }
    if (lensElement.current) {
      const element = lensElement.current
      element.style.transform = `translate(${position - fullWidth / 2}px, ${(height - fullHeight) / 2}px) scale(${rectWidth / fullWidth}, ${rectHeight / fullHeight})`
      element.style.opacity = String(Math.min(1, s * 3))
      element.style.visibility = s > 0.01 ? "visible" : "hidden"
    }
    const shape = capsule(left, top, rectWidth, rectHeight)
    if (accentRef.current) accentRef.current.style.clipPath = `path("${shape}")`
    if (baseRef.current) baseRef.current.style.clipPath = `path(evenodd, "M${-width} ${-height}H${width * 2}V${height * 2}H${-width}Z${shape}")`
  }, [pad, lensWidth, lensHeight])

  const settle = useCallback(() => callbacks.current.onSettle?.(), [])

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
    const element = rootRef.current
    if (!element) return
    const measure = () => {
      const width = element.offsetWidth
      const height = element.offsetHeight
      const next = { width, height, slot: (width - pad * 2) / count }
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
  }, [center, count, pad, paint])

  // Runs after size changes too: the lens element only then has its final box.
  useIsoLayoutEffect(paint, [paint, size])

  /** Sends the glass to a slot, lifting it into a lens on the way. */
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

  // A slot that changed without a pointer (keyboard, or a new value from
  // outside) still has to bring the glass along.
  useEffect(() => {
    if (!drag.current && x.current.target !== center(activeIndex) && metrics.current.slot) moveTo(activeIndex)
  }, [activeIndex, center, moveTo])

  // In layout px, so a scaled ancestor does not throw the glass off.
  const localX = (event: PointerEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    return ((event.clientX - rect.left) / (rect.width || 1)) * (metrics.current.width || rect.width)
  }
  const indexAt = (position: number) => Math.max(0, Math.min(count - 1, Math.floor((position - pad) / metrics.current.slot)))
  const rubberBand = (position: number) => {
    const low = center(0)
    const high = center(count - 1)
    if (position < low) return low - (low - position) * 0.25
    if (position > high) return high + (position - high) * 0.25
    return position
  }

  const onPointerDown = (event: PointerEvent<HTMLElement>) => {
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

  const onPointerMove = (event: PointerEvent<HTMLElement>) => {
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

  const finish = (event: PointerEvent<HTMLElement>, cancelled: boolean) => {
    const d = drag.current
    if (!d || d.pointer !== event.pointerId) return
    drag.current = null
    if (cancelled) return moveTo(activeRef.current)
    const target = d.moved ? indexAt(x.current.target) : d.pressed
    const chosen = callbacks.current.onPick(target)
    moveTo(typeof chosen === "number" ? chosen : target)
  }

  const lensRef = lens.ref
  const setLens = useCallback(
    (element: HTMLElement | null) => {
      lensElement.current = element
      lensRef(element)
    },
    [lensRef],
  )

  const lensStyle: CSSProperties = {
    ...lens.rootProps.style,
    position: "absolute",
    top: 0,
    left: 0,
    width: size.slot * lensWidth || undefined,
    height: size.height * lensHeight || undefined,
    borderRadius: 9999,
    transformOrigin: "50% 50%",
    transition: "none",
    pointerEvents: "none",
    visibility: "hidden",
    zIndex: 2,
  }

  const lensNode: ReactNode = (
    <span {...lens.rootProps} ref={setLens} style={lensStyle} aria-hidden="true">
      {lens.wrap()}
    </span>
  )

  return {
    size,
    rootRef,
    baseRef,
    accentRef,
    pillRef,
    /** Size for the pill element. */
    pillStyle: { width: size.slot || undefined, height: size.height ? size.height - pad * 2 : undefined } as CSSProperties,
    /** Starting style for the accent copy: hidden until the glass moves. */
    accentStyle: { width: size.width || undefined, clipPath: "inset(100%)" } as CSSProperties,
    lens: lensNode,
    rootProps: {
      onPointerDown,
      onPointerMove,
      onPointerUp: (event: PointerEvent<HTMLElement>) => finish(event, false),
      onPointerCancel: (event: PointerEvent<HTMLElement>) => finish(event, true),
    },
    moveTo,
  }
}
