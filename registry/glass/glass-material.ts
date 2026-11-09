"use client"

import "@vepando/liquid-glass-react/style.css"
import "./glass-tokens.css"

import { type ForwardedRef, createContext, useCallback, useContext } from "react"
import { type GlassVariant, type LiquidGlassOptions, useLiquidGlass } from "@vepando/liquid-glass-react"

export type GlassMaterial = "regular" | "clear" | "bar"

const MATERIAL_VARIANT: Record<GlassMaterial, GlassVariant> = { regular: "regular", clear: "clear", bar: "regular" }

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

export function useGlassSurface<T extends HTMLElement>({ material = "regular", forwardedRef, ...options }: GlassSurfaceOptions<T>) {
  const nested = useContext(GlassStack)
  const glass = useLiquidGlass({ variant: MATERIAL_VARIANT[material], ...options, radius: "auto" })
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
