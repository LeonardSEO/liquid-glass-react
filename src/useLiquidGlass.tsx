import {
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useState,
} from "react"
import {
  buildDisplacementMap,
  buildInteriorMask,
  buildSpecularMap,
  imageDataToUrl,
  type SurfaceProfile,
} from "./maps"

/** `regular` and `clear` are calibrated against macOS's NSGlassEffectView styles. `identity` renders no glass. */
/** `lens` is an advanced, strongly refracting look that Apple has no equivalent for. */
export type GlassVariant = "regular" | "clear" | "identity" | "lens"

export type LiquidGlassOptions = {
  /** Glass style, as on Apple platforms. Default: "regular". */
  variant?: GlassVariant
  /** Corner radius in px, or "auto" to read the element's CSS border-radius. Default: "auto". */
  radius?: number | "auto"
  /** @advanced Width of the curved, light-bending rim in px. Default: the `--lg-bezel` CSS variable, else derived from the element size. */
  bezel?: number
  /** @advanced Glass height in px - higher = stronger refraction at the rim. Default: the `--lg-thickness` CSS variable, else derived from the variant. */
  thickness?: number
  /** Any CSS color, ideally translucent. */
  tint?: "light" | "dark" | (string & {})
  /** @advanced Index of refraction (glass ≈ 1.5). */
  ior?: number
  /** @advanced Rim surface profile. */
  profile?: SurfaceProfile
  /** @advanced Extra multiplier on the physical refraction strength. */
  refraction?: number
  /** @advanced Chromatic dispersion: fraction of extra/less bend for red/blue. 0 disables. */
  dispersion?: number
  /** @advanced Frost blur of the backdrop in px. 0 = perfectly clear glass. Default: the `--lg-blur` CSS variable, else the variant. */
  blur?: number
  /** @advanced Backdrop saturation multiplier. Default: the `--lg-saturation` CSS variable, else the variant. */
  saturation?: number
  /** @advanced Specular rim strength 0..1. Default: the `--lg-specular-opacity` CSS variable, else the variant. */
  specular?: number
  /** @advanced Light direction for the specular rim, degrees (-90 = top, -135 = top-left). */
  lightAngle?: number
  /** Press-to-grow + touch glow, like iOS controls. */
  interactive?: boolean
}

export type LiquidGlassRootProps = {
  className: string
  style: CSSProperties
  onPointerDown: (e: ReactPointerEvent<HTMLElement>) => void
  onPointerMove: (e: ReactPointerEvent<HTMLElement>) => void
  onPointerUp: (e: ReactPointerEvent<HTMLElement>) => void
  onPointerLeave: (e: ReactPointerEvent<HTMLElement>) => void
  onPointerCancel: (e: ReactPointerEvent<HTMLElement>) => void
}

export type LiquidGlassHandle = {
  /** Attach to the element that becomes the glass. Stable between renders. */
  ref: (element: HTMLElement | null) => void
  /** Spread on the same element. Merge your own className, style and pointer handlers with them. */
  rootProps: LiquidGlassRootProps
  /** Wraps your content in the glass layers. Use as the element's only child. */
  wrap: (children?: ReactNode) => ReactNode
}

// useLayoutEffect warns during SSR on React 18; fall back to useEffect there.
const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect

let chromiumCache: boolean | undefined
function supportsSvgBackdrop(): boolean {
  if (chromiumCache !== undefined) return chromiumCache
  if (typeof navigator === "undefined") return false
  const ua = navigator.userAgent
  // Only Blink renders SVG filters referenced from backdrop-filter. WebKit
  // (Safari, and every iOS browser - CriOS/FxiOS) and Gecko do not.
  chromiumCache = /Chrome\/\d+/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua)
  return chromiumCache
}

type VariantDefaults = {
  blur: number
  saturation: number
  refraction: number
  dispersion: number
  thicknessRatio: number
  autoBezel: (minSide: number, radius: number) => number
}

// Rim as a fraction of the short side, as measured on the system material.
const rimBezel = (fraction: number) => (minSide: number, radius: number) => Math.max(1.5, Math.min(minSide * fraction, Math.min(radius, minSide / 2)))
const REGULAR: VariantDefaults = { blur: 15, saturation: 1.725, refraction: 2, dispersion: 0, thicknessRatio: 3, autoBezel: rimBezel(0.03) }
const VARIANTS: Record<GlassVariant, VariantDefaults> = {
  regular: REGULAR,
  clear: { blur: 21, saturation: 1.2, refraction: 1.906, dispersion: 0.0775, thicknessRatio: 3, autoBezel: rimBezel(0.0625) },
  lens: {
    blur: 3,
    saturation: 1.5,
    refraction: 1,
    dispersion: 0.06,
    thicknessRatio: 1.5,
    autoBezel: (minSide, radius) => Math.max(6, Math.min(minSide * 0.25, Math.min(radius, minSide / 2), 56)),
  },
  identity: REGULAR,
}

type Maps = { displacement: string; specular: string; mask: string; scale: number; width: number; height: number }

const mapCache = new Map<string, Maps>()

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
  // Computed longhands can be "24px" or "24px 12px" (elliptical): use the first.
  const first = value.trim().split(/\s+/)[0] ?? ""
  const n = parseFloat(first) || 0
  return first.endsWith("%") ? (n / 100) * minSide : n
}

type Measured = { w: number; h: number; radius: number; bezel?: number; thickness?: number }

export function useLiquidGlass({
  variant = "regular",
  radius: radiusOption = "auto",
  bezel: bezelOption,
  thickness: thicknessOption,
  tint = "light",
  ior = 1.5,
  profile = "squircle",
  refraction: refractionOption,
  dispersion: dispersionOption,
  blur,
  saturation,
  specular,
  lightAngle = -135,
  interactive = false,
}: LiquidGlassOptions = {}): LiquidGlassHandle {
  const defaults = VARIANTS[variant]
  const refraction = refractionOption ?? defaults.refraction
  const dispersion = dispersionOption ?? defaults.dispersion
  const filterId = "lg-" + useId().replace(/[^a-zA-Z0-9_-]/g, "")
  const [element, setElement] = useState<HTMLElement | null>(null)
  const [measured, setMeasured] = useState<Measured | null>(null)
  const [svgSupported, setSvgSupported] = useState(false)
  const [pressed, setPressed] = useState(false)

  const measure = useCallback(() => {
    if (!element) return
    const w = Math.round(element.offsetWidth)
    const h = Math.round(element.offsetHeight)
    const css = getComputedStyle(element)
    const next: Measured = {
      w,
      h,
      radius: parseRadius(css.borderTopLeftRadius, Math.min(w, h)),
      bezel: parseLength(css.getPropertyValue("--lg-bezel")),
      thickness: parseLength(css.getPropertyValue("--lg-thickness")),
    }
    setMeasured((m) =>
      m && m.w === next.w && m.h === next.h && m.radius === next.radius && m.bezel === next.bezel && m.thickness === next.thickness ? m : next,
    )
  }, [element])

  useIsoLayoutEffect(() => {
    setSvgSupported(supportsSvgBackdrop())
    if (!element) return
    // Measure synchronously so the filter exists on first paint (and in
    // background tabs, where ResizeObserver may not fire until visible).
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(element, { box: "border-box" })
    const stopTheme = onThemeChange(measure)
    return () => {
      ro.disconnect()
      stopTheme()
    }
  }, [element, measure])

  // A changed class or prop can move the tokens without a resize. Cheap when
  // nothing changed: setMeasured bails out on equal values.
  useIsoLayoutEffect(measure)

  const size = measured && measured.w >= 2 && measured.h >= 2 ? measured : null
  const radius = radiusOption === "auto" ? size?.radius : radiusOption
  const bezelCss = bezelOption ?? size?.bezel
  const thicknessCss = thicknessOption ?? size?.thickness

  const maps = useMemo<Maps | null>(() => {
    if (!size || radius === undefined) return null
    const minSide = Math.min(size.w, size.h)
    const bezel = bezelCss ?? defaults.autoBezel(minSide, radius)
    const thickness = thicknessCss ?? bezel * defaults.thicknessRatio
    const dpr = Math.min(2, typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1)
    const key = [size.w, size.h, radius, bezel, thickness, ior, profile, lightAngle, dpr].join("|")
    let base = mapCache.get(key)
    if (!base) {
      const shape = { width: size.w, height: size.h, radius }
      const disp = buildDisplacementMap(shape, { bezel, thickness, ior, profile })
      const spec = buildSpecularMap(shape, { angle: lightAngle, rimWidth: 1.2, glowWidth: Math.min(20, Math.max(4, bezel * 0.6)) }, dpr)
      base = {
        displacement: imageDataToUrl(disp),
        specular: imageDataToUrl(spec),
        mask: imageDataToUrl(buildInteriorMask(shape, bezel, 1)),
        scale: disp.scale,
        width: disp.width,
        height: disp.height,
      }
      mapCache.set(key, base)
      // Small LRU: identical controls (buttons, pills) share one set of maps.
      if (mapCache.size > 64) mapCache.delete(mapCache.keys().next().value!)
    }
    return { ...base, scale: base.scale * refraction }
  }, [size?.w, size?.h, radius, bezelCss, thicknessCss, ior, profile, refraction, lightAngle, defaults])

  const setPointer = (e: ReactPointerEvent<HTMLElement>) => {
    if (!element) return
    const r = element.getBoundingClientRect()
    element.style.setProperty("--lg-px", `${((e.clientX - r.left) / r.width) * 100}%`)
    element.style.setProperty("--lg-py", `${((e.clientY - r.top) / r.height) * 100}%`)
  }

  const identity = variant === "identity"
  const useSvg = svgSupported && maps !== null && !identity
  // Presets live in CSS so a dark theme can swap them without a re-render.
  const blurVar = `var(--lg-blur, var(--lg-preset-blur, ${defaults.blur}px))`
  const saturationVar = `var(--lg-saturation, var(--lg-preset-saturation, ${defaults.saturation}))`
  const brightnessVar = "var(--lg-preset-brightness, 1.04)"
  const backdrop = identity
    ? "none"
    : useSvg
      ? `blur(${blurVar}) url(#${filterId}) saturate(${saturationVar}) brightness(${brightnessVar})`
      : `blur(max(${blurVar}, 8px)) saturate(${saturationVar}) brightness(1.05)`

  const s = maps?.scale ?? 0

  const rootProps: LiquidGlassRootProps = {
    className: ["lg", `lg--${variant}`, tint === "dark" && "lg--dark", interactive && "lg--interactive", pressed && "lg--pressed", !useSvg && !identity && "lg--fallback"]
      .filter(Boolean)
      .join(" "),
    style: {
      ...(typeof radiusOption === "number" ? { borderRadius: radiusOption } : null),
      // backdrop-filter lives on the root on purpose: children that use
      // mix-blend-mode turn their parent into a "backdrop root", so a
      // backdrop-filter on a child layer would only see an empty backdrop.
      // The override variable lets CSS replace it despite being inline (see
      // the accessibility rules in liquid-glass.css).
      backdropFilter: `var(--lg-backdrop-override, ${backdrop})`,
      WebkitBackdropFilter: `var(--lg-backdrop-override, ${backdrop})`,
      ...(blur !== undefined ? { "--lg-blur": `${blur}px` } : null),
      ...(saturation !== undefined ? { "--lg-saturation": saturation } : null),
      ...(specular !== undefined ? { "--lg-specular-opacity": specular } : null),
      ...(tint !== "light" && tint !== "dark" ? { "--lg-tint": tint } : null),
    } as CSSProperties,
    onPointerDown: (e) => {
      if (!interactive) return
      setPointer(e)
      setPressed(true)
    },
    onPointerMove: (e) => {
      if (interactive) setPointer(e)
    },
    onPointerUp: () => setPressed(false),
    onPointerLeave: () => setPressed(false),
    onPointerCancel: () => setPressed(false),
  }

  // Spans, not divs, so the glass is valid inside a <button>. The absolutely
  // positioned layers are block-level anyway; .lg__content sets display: block.
  const wrap = (children?: ReactNode) => (
    <>
      <span
        className="lg__tint"
        style={maps ? { maskImage: `url(${maps.mask})`, WebkitMaskImage: `url(${maps.mask})` } : undefined}
      />
      {maps && <span className="lg__specular" style={{ backgroundImage: `url(${maps.specular})` }} />}
      <span className="lg__glow" />
      <span className="lg__content">{children}</span>

      {useSvg && maps && (
        <svg className="lg__defs" aria-hidden="true" focusable="false" width="0" height="0">
          <filter
            id={filterId}
            x="0"
            y="0"
            width={maps.width}
            height={maps.height}
            filterUnits="userSpaceOnUse"
            primitiveUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feImage
              href={maps.displacement}
              x="0"
              y="0"
              width={maps.width}
              height={maps.height}
              preserveAspectRatio="none"
              result="map"
            />
            {dispersion > 0 ? (
              <>
                <feDisplacementMap in="SourceGraphic" in2="map" scale={s * (1 + dispersion)} xChannelSelector="R" yChannelSelector="G" result="dispR" />
                <feColorMatrix in="dispR" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r" />
                <feDisplacementMap in="SourceGraphic" in2="map" scale={s} xChannelSelector="R" yChannelSelector="G" result="dispG" />
                <feColorMatrix in="dispG" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="g" />
                <feDisplacementMap in="SourceGraphic" in2="map" scale={s * (1 - dispersion)} xChannelSelector="R" yChannelSelector="G" result="dispB" />
                <feColorMatrix in="dispB" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="b" />
                <feComposite in="r" in2="g" operator="arithmetic" k2="1" k3="1" result="rg" />
                <feComposite in="rg" in2="b" operator="arithmetic" k2="1" k3="1" />
              </>
            ) : (
              <feDisplacementMap in="SourceGraphic" in2="map" scale={s} xChannelSelector="R" yChannelSelector="G" />
            )}
          </filter>
        </svg>
      )}
    </>
  )

  return { ref: setElement, rootProps, wrap }
}
