"use client"

import { type HTMLAttributes, type KeyboardEvent, type PointerEvent, forwardRef, useCallback, useEffect, useRef, useState } from "react"
import { useLensThumb } from "@/registry/glass/glass-lens-thumb"
import { useIsoLayoutEffect } from "@/registry/glass/glass-spring"

export type GlassSliderProps = Omit<HTMLAttributes<HTMLDivElement>, "defaultValue" | "onChange" | "role"> & {
  value?: number
  defaultValue?: number
  /** Called while the value changes. */
  onValueChange?: (value: number) => void
  /** Called once the person lets go or finishes with the keyboard. */
  onValueCommit?: (value: number) => void
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  /** Submits the value with a form under this name. */
  name?: string
}

// Measured on iOS 26 in points: a 6 tall track and a 37 × 24 capsule that
// lifts into a 58 × 37.5 lens while it is dragged.
const HEIGHT = 28
const THUMB_WIDTH = 37
const THUMB_HEIGHT = 24
const LIFT = 37.5 / THUMB_HEIGHT
/** How far the track stretches when dragged past either end, at most. */
const OVERSHOOT = 18
// Stiff enough to keep up with a finger, soft enough to stretch the lens a little.
const FOLLOW = { stiffness: 900, damping: 48 }

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
const decimals = (step: number) => (String(step).split(".")[1] ?? "").length

/**
 * An iOS 26 slider: a white capsule on a thin track that lifts into a clear
 * glass lens while it is dragged, magnifying the filled track beneath it.
 */
export const GlassSlider = forwardRef<HTMLDivElement, GlassSliderProps>(function GlassSlider(
  {
    value: valueProp,
    defaultValue,
    onValueChange,
    onValueCommit,
    min = 0,
    max = 100,
    step = 1,
    disabled = false,
    name,
    className,
    onPointerDown,
    onKeyDown,
    ...props
  },
  forwardedRef,
) {
  const [uncontrolled, setUncontrolled] = useState(() => clamp(defaultValue ?? min, min, max))
  const value = clamp(valueProp ?? uncontrolled, min, max)
  const valueRef = useRef(value)
  valueRef.current = value

  const root = useRef<HTMLDivElement | null>(null)
  const track = useRef<HTMLSpanElement>(null)
  const fill = useRef<HTMLSpanElement>(null)
  const width = useRef(0)
  const drag = useRef<number | null>(null)

  const thumb = useLensThumb({
    width: THUMB_WIDTH,
    height: THUMB_HEIGHT,
    lift: LIFT,
    centerY: HEIGHT / 2,
    move: FOLLOW,
    stretch: true,
    // Past either end the track stretches with the thumb, then springs back with it.
    onPaint: (x) => {
      const start = THUMB_WIDTH / 2
      const end = Math.max(start, width.current - THUMB_WIDTH / 2)
      const before = Math.max(0, start - x)
      const after = Math.max(0, x - end)
      if (track.current) {
        track.current.style.left = `${-before}px`
        track.current.style.right = `${-after}px`
      }
      if (fill.current) fill.current.style.width = `${x + before}px`
    },
  })
  const { place, moveTo } = thumb

  const xOf = useCallback(
    (v: number) => {
      const t = max > min ? (v - min) / (max - min) : 0
      return THUMB_WIDTH / 2 + t * Math.max(0, width.current - THUMB_WIDTH)
    },
    [min, max],
  )

  const snap = (v: number) => {
    const stepped = min + Math.round((v - min) / step) * step
    return clamp(Number(stepped.toFixed(decimals(step))), min, max)
  }

  const setRoot = useCallback(
    (element: HTMLDivElement | null) => {
      root.current = element
      if (typeof forwardedRef === "function") forwardedRef(element)
      else if (forwardedRef) forwardedRef.current = element
    },
    [forwardedRef],
  )

  useIsoLayoutEffect(() => {
    const element = root.current
    if (!element) return
    const measure = () => {
      width.current = element.offsetWidth
      if (drag.current === null) place(xOf(valueRef.current))
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [place, xOf])

  // An outside change of `value` slides the thumb.
  useEffect(() => {
    if (drag.current === null) moveTo(xOf(value))
  }, [value, moveTo, xOf])

  const update = (next: number, stretch = 0) => {
    if (next !== valueRef.current) {
      valueRef.current = next
      if (valueProp === undefined) setUncontrolled(next)
      onValueChange?.(next)
    }
    moveTo(xOf(next) + stretch)
  }

  /** The value under the pointer, and how far the pointer is past either end (negative before the start). */
  const pointerAt = (event: PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const span = width.current - THUMB_WIDTH
    if (!rect.width || span <= 0) return { value: valueRef.current, past: 0 }
    const local = ((event.clientX - rect.left) / rect.width) * width.current - THUMB_WIDTH / 2
    const past = local < 0 ? local : local > span ? local - span : 0
    return { value: snap(min + clamp(local / span, 0, 1) * (max - min)), past }
  }

  /** Follows the pointer, letting the thumb pull the track a little past either end. */
  const follow = (event: PointerEvent<HTMLDivElement>) => {
    const { value: next, past } = pointerAt(event)
    const stretch = Math.sign(past) * OVERSHOOT * (1 - Math.exp(-Math.abs(past) / (OVERSHOOT * 3)))
    update(next, stretch)
  }

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    onPointerDown?.(event)
    if (event.defaultPrevented || disabled || event.button !== 0) return
    event.currentTarget.setPointerCapture(event.pointerId)
    drag.current = event.pointerId
    thumb.press()
    follow(event)
  }

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (drag.current === event.pointerId) follow(event)
  }

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (drag.current !== event.pointerId) return
    drag.current = null
    thumb.release()
    moveTo(xOf(valueRef.current))
    onValueCommit?.(valueRef.current)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event)
    if (event.defaultPrevented || disabled) return
    const big = Math.max(step, (max - min) / 10)
    const next =
      event.key === "ArrowRight" || event.key === "ArrowUp" ? value + step
      : event.key === "ArrowLeft" || event.key === "ArrowDown" ? value - step
      : event.key === "PageUp" ? value + big
      : event.key === "PageDown" ? value - big
      : event.key === "Home" ? min
      : event.key === "End" ? max
      : null
    if (next === null) return
    event.preventDefault()
    const snapped = snap(next)
    update(snapped)
    onValueCommit?.(snapped)
  }

  return (
    <div
      {...props}
      ref={setRoot}
      role="slider"
      tabIndex={disabled ? -1 : 0}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-orientation="horizontal"
      aria-disabled={disabled || undefined}
      data-disabled={disabled ? "" : undefined}
      className={["glass-slider", className].filter(Boolean).join(" ")}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onKeyDown={handleKeyDown}
    >
      <span ref={track} className="glass-slider__track" aria-hidden="true">
        <span ref={fill} className="glass-slider__fill" />
      </span>
      {thumb.element}
      {name !== undefined && <input type="hidden" name={name} value={value} />}
    </div>
  )
})
