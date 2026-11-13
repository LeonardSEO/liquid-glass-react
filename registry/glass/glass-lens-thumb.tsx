"use client"

import { type ReactNode, useCallback, useRef } from "react"
import { useLiquidGlass } from "@vepando/liquid-glass-react"
import "@/registry/glass/glass-material"
import {
  type SpringConfig,
  createSpring,
  isSettled,
  prefersReducedMotion,
  snapSpring,
  stepSpring,
  useAnimationFrames,
  useIsoLayoutEffect,
} from "@/registry/glass/glass-spring"

/** Width of the refracting rim as a share of the lens height, as on iOS 26 controls. */
const RIM = 0.17

/**
 * The optics of the lens that iOS 26 controls lift into: a clear middle and
 * a narrow rim that bends the light around it, without a colour fringe.
 */
export function lensOptics(height?: number) {
  const rim = height ? Math.round(height * RIM) : undefined
  return { variant: "lens", blur: 0, saturation: 1.1, dispersion: 0, refraction: 1.2, bezel: rim, thickness: rim && rim * 2, radius: "auto" } as const
}

const GROW: SpringConfig = { stiffness: 420, damping: 28 }
const MOVE: SpringConfig = { stiffness: 520, damping: 34 }

export type LensThumbOptions = {
  /** Size of the white capsule at rest, in px. */
  width: number
  height: number
  /** How much larger the lens is than the capsule. */
  lift: number
  /** Vertical centre of the thumb inside its positioned parent, in px. */
  centerY: number
  /** Horizontal centre to start at, in px. */
  initialX?: number
  move?: SpringConfig
  /** Stretch the lens in the direction it travels, by its speed. */
  stretch?: boolean
  /** Called on every painted frame with the thumb's centre and how far it is lifted (0..1). */
  onPaint?: (x: number, lifted: number) => void
}

/**
 * A white capsule that lifts into a clear glass lens, as the thumb of an
 * iOS 26 switch or slider does. Render `thumb.element` inside a positioned
 * parent: the lens is a sibling of what it magnifies, so its backdrop is the
 * track and the page around it. Its box has the size of the lens and is
 * scaled down at rest, which keeps the refraction maps the same while it grows.
 */
export function useLensThumb({ width, height, lift, centerY, initialX = 0, move = MOVE, stretch = false, onPaint }: LensThumbOptions) {
  const lensWidth = width * lift
  const lensHeight = height * lift
  const lens = useLiquidGlass({ ...lensOptics(lensHeight), tint: "rgba(255,255,255,0)" })

  const x = useRef(createSpring(initialX))
  const lifted = useRef(createSpring(0))
  const held = useRef(false)
  const thumb = useRef<HTMLElement | null>(null)
  const glow = useRef<HTMLSpanElement>(null)
  const knob = useRef<HTMLSpanElement>(null)
  const paintCallback = useRef(onPaint)
  paintCallback.current = onPaint

  const paint = useCallback(() => {
    const s = lifted.current.value
    const scale = (1 + (lift - 1) * s) / lift
    const pull = stretch ? Math.min(0.14, Math.abs(x.current.velocity) / 3500) * Math.max(0, s) : 0
    const transform = `translate(${x.current.value - lensWidth / 2}px, ${centerY - lensHeight / 2}px) scale(${scale * (1 + pull)}, ${scale * (1 - pull / 2)})`
    if (thumb.current) thumb.current.style.transform = transform
    if (glow.current) {
      glow.current.style.transform = transform
      glow.current.style.opacity = String(Math.min(1, Math.max(0, s)))
    }
    if (knob.current) knob.current.style.opacity = String(Math.min(1, Math.max(0, 1 - s * 1.8)))
    paintCallback.current?.(x.current.value, s)
  }, [lift, lensWidth, lensHeight, centerY, stretch])

  const frames = useAnimationFrames((dt) => {
    const p = x.current
    const s = lifted.current
    stepSpring(p, move, dt)
    stepSpring(s, GROW, dt)
    // A lens that was let go turns white again once it has arrived.
    if (!held.current && s.target === 1 && isSettled(p, 1.5, 30)) s.target = 0
    if (isSettled(p, 0.2, 2) && isSettled(s, 0.005, 0.05) && (held.current || s.target === 0)) {
      snapSpring(p)
      snapSpring(s)
      paint()
      return false
    }
    paint()
    return true
  })

  useIsoLayoutEffect(paint, [paint])

  /** Puts the thumb on `position` without animating. */
  const place = useCallback(
    (position: number) => {
      snapSpring(x.current, position)
      paint()
    },
    [paint],
  )

  /** Slides the thumb to `position`. With `lift`, it turns into glass on the way and back to white when it lands. */
  const moveTo = useCallback(
    (position: number, { lift: lifting = false } = {}) => {
      if (prefersReducedMotion()) {
        frames.stop()
        snapSpring(x.current, position)
        snapSpring(lifted.current, 0)
        paint()
        return
      }
      x.current.target = position
      if (lifting) lifted.current.target = 1
      frames.start()
    },
    [frames, paint],
  )

  /** Lifts the thumb into glass and keeps it there until `release()`. */
  const press = useCallback(() => {
    held.current = true
    if (prefersReducedMotion()) return
    lifted.current.target = 1
    frames.start()
  }, [frames])

  const release = useCallback(() => {
    held.current = false
    frames.start()
  }, [frames])

  const lensRef = lens.ref
  const setThumb = useCallback(
    (element: HTMLElement | null) => {
      thumb.current = element
      lensRef(element)
    },
    [lensRef],
  )

  const element: ReactNode = (
    <>
      <span ref={glow} className="glass-lens-thumb__glow" style={{ width: lensWidth, height: lensHeight }} aria-hidden="true" />
      <span
        {...lens.rootProps}
        ref={setThumb}
        className={`${lens.rootProps.className} glass-lens-thumb`}
        style={{ ...lens.rootProps.style, width: lensWidth, height: lensHeight }}
        aria-hidden="true"
      >
        {lens.wrap(<span ref={knob} className="glass-lens-thumb__knob" />)}
      </span>
    </>
  )

  return { element, place, moveTo, press, release, target: () => x.current.target }
}
