"use client"

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from "react"

export type SpringConfig = { stiffness: number; damping: number }
export type Spring = { value: number; velocity: number; target: number }

export const createSpring = (value = 0): Spring => ({ value, velocity: 0, target: value })

/** Advances a spring by `dt` seconds in two half steps, which keeps stiff springs stable at low frame rates. */
export function stepSpring(spring: Spring, config: SpringConfig, dt: number) {
  for (let i = 0; i < 2; i++) {
    const h = dt / 2
    spring.velocity += (-config.stiffness * (spring.value - spring.target) - config.damping * spring.velocity) * h
    spring.value += spring.velocity * h
  }
}

export const isSettled = (spring: Spring, distance: number, speed: number) =>
  Math.abs(spring.value - spring.target) <= distance && Math.abs(spring.velocity) <= speed

/** Puts a spring at rest on `value` (default: its target). */
export function snapSpring(spring: Spring, value = spring.target) {
  spring.value = spring.target = value
  spring.velocity = 0
}

export const prefersReducedMotion = () => typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches

export const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect

/** Calls `frame(dt)` on every animation frame from `start()` until it returns false. */
export function useAnimationFrames(frame: (dt: number) => boolean) {
  const latest = useRef(frame)
  latest.current = frame
  const id = useRef(0)
  const last = useRef(0)

  const loop = useCallback((now: number) => {
    const dt = Math.min(0.032, (now - last.current) / 1000 || 0.016)
    last.current = now
    id.current = latest.current(dt) ? requestAnimationFrame(loop) : 0
  }, [])

  const start = useCallback(() => {
    if (id.current) return
    last.current = performance.now()
    id.current = requestAnimationFrame(loop)
  }, [loop])

  const stop = useCallback(() => {
    cancelAnimationFrame(id.current)
    id.current = 0
  }, [])

  useEffect(() => stop, [stop])

  return useMemo(() => ({ start, stop }), [start, stop])
}
