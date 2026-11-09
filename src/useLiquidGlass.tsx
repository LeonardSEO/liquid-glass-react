import { type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode, useId, useMemo, useState } from "react"
import { GlassFilter, supportsSvgBackdrop } from "./GlassFilter"
import { getGlassMaps } from "./glassMaps"
import type { SurfaceProfile } from "./maps"
import { useIsoLayoutEffect, useMeasuredGlass } from "./measure"
import { type GlassVariant, VARIANTS } from "./variants"

export type { GlassVariant } from "./variants"

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
  const geometry = VARIANTS[variant]
  const refraction = refractionOption ?? geometry.refraction
  const dispersion = dispersionOption ?? geometry.dispersion
  const filterId = "lg-" + useId().replace(/[^a-zA-Z0-9_-]/g, "")
  const [element, setElement] = useState<HTMLElement | null>(null)
  const [svgSupported, setSvgSupported] = useState(false)
  const [pressed, setPressed] = useState(false)

  useIsoLayoutEffect(() => setSvgSupported(supportsSvgBackdrop()), [])

  const size = useMeasuredGlass(element)
  const radius = radiusOption === "auto" ? size?.radius : radiusOption
  const bezelToken = bezelOption ?? size?.bezel
  const thicknessToken = thicknessOption ?? size?.thickness

  const maps = useMemo(() => {
    if (variant === "identity" || !size || radius === undefined) return null
    const minSide = Math.min(size.width, size.height)
    const bezel = bezelToken ?? geometry.autoBezel(minSide, radius)
    const thickness = thicknessToken ?? bezel * geometry.thicknessRatio
    return getGlassMaps({ width: size.width, height: size.height, radius }, { bezel, thickness, ior, profile }, lightAngle)
  }, [variant, size?.width, size?.height, radius, bezelToken, thicknessToken, ior, profile, lightAngle, geometry])

  const setPointer = (e: ReactPointerEvent<HTMLElement>) => {
    if (!element) return
    const r = element.getBoundingClientRect()
    element.style.setProperty("--lg-px", `${((e.clientX - r.left) / r.width) * 100}%`)
    element.style.setProperty("--lg-py", `${((e.clientY - r.top) / r.height) * 100}%`)
  }

  const useSvg = svgSupported && maps !== null
  const blurVar = "var(--lg-blur, var(--lg-preset-blur))"
  const toneVars = "saturate(var(--lg-saturation, var(--lg-preset-saturation))) brightness(var(--lg-brightness, var(--lg-preset-brightness)))"
  const backdrop = useSvg ? `blur(${blurVar}) url(#${filterId}) ${toneVars}` : `blur(max(${blurVar}, 8px)) ${toneVars}`

  const rootProps: LiquidGlassRootProps = {
    className: ["lg", `lg--${variant}`, tint === "dark" && "lg--dark", interactive && "lg--interactive", pressed && "lg--pressed", !useSvg && "lg--fallback"]
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
      <span className="lg__tint" style={maps ? ({ "--lg-mask": `url(${maps.mask})` } as CSSProperties) : undefined} />
      {maps && <span className="lg__specular" style={{ backgroundImage: `url(${maps.specular})` }} />}
      <span className="lg__glow" />
      <span className="lg__content">{children}</span>
      {useSvg && <GlassFilter id={filterId} maps={maps} scale={maps.scale * refraction} dispersion={dispersion} />}
    </>
  )

  return { ref: setElement, rootProps, wrap }
}
