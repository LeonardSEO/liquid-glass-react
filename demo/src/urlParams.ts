import type { LiquidGlassProps } from "@vepando/liquid-glass-react"

export const params = new URLSearchParams(location.search)

export const numberParam = (key: string, fallback: number) => (params.has(key) ? Number(params.get(key)) : fallback)

/** Lets a scene be tuned from the URL: ?thickness=40&blur=2 ... */
export const glassOverrides: Partial<LiquidGlassProps> = Object.fromEntries(
  (["bezel", "thickness", "ior", "refraction", "dispersion", "blur", "saturation", "specular"] as const).filter((key) => params.has(key)).map((key) => [key, Number(params.get(key))]),
)
