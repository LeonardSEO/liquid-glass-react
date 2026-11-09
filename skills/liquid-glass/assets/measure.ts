import { useCallback, useEffect, useLayoutEffect, useState } from "react"

// useLayoutEffect warns during SSR on React 18; fall back to useEffect there.
export const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect

// One observer for all glass on the page: a theme switch on <html> can change
// radius and bezel tokens without any element resizing or re-rendering.
const themeListeners = new Set<() => void>()
let themeObserver: MutationObserver | undefined
function onThemeChange(listener: () => void): () => void {
  themeListeners.add(listener)
  if (!themeObserver) {
    themeObserver = new MutationObserver(() => themeListeners.forEach((l) => l()))
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-theme"] })
  }
  return () => {
    themeListeners.delete(listener)
    if (themeListeners.size === 0) {
      themeObserver?.disconnect()
      themeObserver = undefined
    }
  }
}

/** Parses "12", "12px" or "0.75rem" to px. Anything else (including empty) is undefined. */
function parseLength(value: string): number | undefined {
  const match = /^\s*(-?[\d.]+)(px|rem)?\s*$/.exec(value)
  if (!match) return undefined
  const n = Number(match[1])
  if (!Number.isFinite(n)) return undefined
  if (match[2] !== "rem") return n
  return n * (parseFloat(getComputedStyle(document.documentElement).fontSize) || 16)
}

function parseRadius(value: string, minSide: number): number {
  // Computed longhands can be "24px" or "24px 12px" (elliptical).
  const first = value.trim().split(/\s+/)[0] ?? ""
  const n = parseFloat(first) || 0
  return first.endsWith("%") ? (n / 100) * minSide : n
}

type MeasuredGlass = { width: number; height: number; radius: number; bezel?: number; thickness?: number }

const same = (a: MeasuredGlass, b: MeasuredGlass) =>
  a.width === b.width && a.height === b.height && a.radius === b.radius && a.bezel === b.bezel && a.thickness === b.thickness

/** The element's size and glass tokens, kept current through resizes and theme switches. */
export function useMeasuredGlass(element: HTMLElement | null): MeasuredGlass | null {
  const [measured, setMeasured] = useState<MeasuredGlass | null>(null)

  const measure = useCallback(() => {
    if (!element) return
    const width = Math.round(element.offsetWidth)
    const height = Math.round(element.offsetHeight)
    const css = getComputedStyle(element)
    const next: MeasuredGlass = {
      width,
      height,
      radius: parseRadius(css.borderTopLeftRadius, Math.min(width, height)),
      bezel: parseLength(css.getPropertyValue("--lg-bezel")),
      thickness: parseLength(css.getPropertyValue("--lg-thickness")),
    }
    setMeasured((current) => (current && same(current, next) ? current : next))
  }, [element])

  useIsoLayoutEffect(() => {
    if (!element) return
    // Measure synchronously so the filter exists on first paint (and in
    // background tabs, where ResizeObserver may not fire until visible).
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element, { box: "border-box" })
    const stopTheme = onThemeChange(measure)
    return () => {
      observer.disconnect()
      stopTheme()
    }
  }, [element, measure])

  // A changed class or prop can move the tokens without a resize.
  useIsoLayoutEffect(measure)

  return measured && measured.width >= 2 && measured.height >= 2 ? measured : null
}
