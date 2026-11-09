"use client"

import "@vepando/liquid-glass-react/style.css"
import "./glass-tokens.css"

import { type ForwardedRef, createContext, useCallback, useContext } from "react"
import { type LiquidGlassOptions, useLiquidGlass } from "@vepando/liquid-glass-react"

export type GlassMaterial = "clear" | "regular" | "reading"

/** Base UI also allows a className function; these components only take strings. */
export type WithStringClassName<T> = Omit<T, "className"> & { className?: string }

/**
 * True inside a surface that already has a backdrop-filter. Such a surface
 * hides the page from anything nested in it, so nested controls render as
 * inset glass without a backdrop of their own.
 */
export const GlassStack = createContext(false)

type GlassSurfaceOptions<T> = Omit<LiquidGlassOptions, "radius"> & {
  material?: GlassMaterial
  forwardedRef?: ForwardedRef<T>
}

export function useGlassSurface<T extends HTMLElement>({ material = "clear", forwardedRef, ...options }: GlassSurfaceOptions<T>) {
  const nested = useContext(GlassStack)
  // The filter steps for dispersion are the main frame cost when many small
  // controls are visible, and inset glass has no filter to spend them on.
  const dispersion = options.dispersion ?? (material === "clear" || nested ? 0 : undefined)
  const glass = useLiquidGlass({ variant: "lens", ...options, dispersion, radius: "auto" })
  const glassRef = glass.ref
  const ref = useCallback(
    (element: T | null) => {
      glassRef(element)
      if (typeof forwardedRef === "function") forwardedRef(element)
      else if (forwardedRef) forwardedRef.current = element
    },
    [glassRef, forwardedRef],
  )
  return {
    ref,
    wrap: glass.wrap,
    rootProps: {
      ...glass.rootProps,
      className: `${glass.rootProps.className} glass-${nested ? "inset" : material}`,
    },
  }
}
