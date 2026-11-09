/** `regular` is calibrated against macOS's NSGlassEffectView. `clear` is see-through glass that bends what is behind it. `identity` renders no glass. `lens` is an advanced, strongly refracting look that Apple has no equivalent for. */
export type GlassVariant = "regular" | "clear" | "identity" | "lens"

/** What a variant decides in code. Its appearance lives in liquid-glass.css, where a theme can swap it. */
type VariantGeometry = {
  refraction: number
  dispersion: number
  thicknessRatio: number
  autoBezel: (minSide: number, radius: number) => number
}

const fitToRadius = (bezel: number, minSide: number, radius: number) => Math.min(bezel, Math.min(radius, minSide / 2))
const wideBezel = (minSide: number, radius: number) => Math.max(6, fitToRadius(Math.min(minSide * 0.25, 56), minSide, radius))

const REGULAR: VariantGeometry = {
  refraction: 2,
  dispersion: 0,
  thicknessRatio: 3,
  // Measured on the system material.
  autoBezel: (minSide, radius) => Math.max(1.5, fitToRadius(minSide * 0.03, minSide, radius)),
}

export const VARIANTS: Record<GlassVariant, VariantGeometry> = {
  regular: REGULAR,
  clear: { refraction: 1.3, dispersion: 0.06, thicknessRatio: 1.5, autoBezel: wideBezel },
  lens: { refraction: 1, dispersion: 0.06, thicknessRatio: 1.5, autoBezel: wideBezel },
  identity: REGULAR,
}
