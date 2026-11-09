import { Fragment } from "react"
import type { GlassMaps } from "./glassMaps"

export function supportsSvgBackdrop(): boolean {
  const ua = navigator.userAgent
  // Only Blink renders SVG filters referenced from backdrop-filter. WebKit
  // (Safari, and every iOS browser - CriOS/FxiOS) and Gecko do not.
  return /Chrome\/\d+/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua)
}

const CHANNELS = [
  { name: "r", spread: 1, matrix: "1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" },
  { name: "g", spread: 0, matrix: "0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" },
  { name: "b", spread: -1, matrix: "0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" },
]

export function GlassFilter({ id, maps, scale, dispersion }: { id: string; maps: GlassMaps; scale: number; dispersion: number }) {
  return (
    <svg className="lg__defs" aria-hidden="true" focusable="false" width="0" height="0">
      <filter id={id} x="0" y="0" width={maps.width} height={maps.height} filterUnits="userSpaceOnUse" primitiveUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
        <feImage href={maps.displacement} x="0" y="0" width={maps.width} height={maps.height} preserveAspectRatio="none" result="map" />
        {dispersion > 0 ? (
          <>
            {CHANNELS.map(({ name, spread, matrix }) => (
              <Fragment key={name}>
                <feDisplacementMap in="SourceGraphic" in2="map" scale={scale * (1 + spread * dispersion)} xChannelSelector="R" yChannelSelector="G" result={`bent-${name}`} />
                <feColorMatrix in={`bent-${name}`} type="matrix" values={matrix} result={name} />
              </Fragment>
            ))}
            <feComposite in="r" in2="g" operator="arithmetic" k2="1" k3="1" result="rg" />
            <feComposite in="rg" in2="b" operator="arithmetic" k2="1" k3="1" />
          </>
        ) : (
          <feDisplacementMap in="SourceGraphic" in2="map" scale={scale} xChannelSelector="R" yChannelSelector="G" />
        )}
      </filter>
    </svg>
  )
}
