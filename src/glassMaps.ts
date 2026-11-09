import { type GlassShape, type OpticsOptions, buildDisplacementMap, buildInteriorMask, buildSpecularMap, imageDataToUrl } from "./maps"

export type GlassMaps = { displacement: string; specular: string; mask: string; scale: number; width: number; height: number }

const CACHE_SIZE = 64
const cache = new Map<string, GlassMaps>()

/** Maps for one shape. Identical controls (buttons, pills) share a single set. */
export function getGlassMaps(shape: GlassShape, optics: OpticsOptions, lightAngle: number): GlassMaps {
  const dpr = Math.min(2, window.devicePixelRatio || 1)
  const key = [shape.width, shape.height, shape.radius, optics.bezel, optics.thickness, optics.ior, optics.profile, lightAngle, dpr].join("|")
  const cached = cache.get(key)
  if (cached) return cached

  const displacement = buildDisplacementMap(shape, optics)
  const specular = buildSpecularMap(shape, { angle: lightAngle, rimWidth: 1.2, glowWidth: Math.min(20, Math.max(4, optics.bezel * 0.6)) }, dpr)
  const maps: GlassMaps = {
    displacement: imageDataToUrl(displacement),
    specular: imageDataToUrl(specular),
    mask: imageDataToUrl(buildInteriorMask(shape, optics.bezel, 1)),
    scale: displacement.scale,
    width: displacement.width,
    height: displacement.height,
  }
  cache.set(key, maps)
  if (cache.size > CACHE_SIZE) cache.delete(cache.keys().next().value!)
  return maps
}
