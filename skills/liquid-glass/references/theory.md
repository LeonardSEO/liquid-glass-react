# Liquid Glass: how the refraction actually works

Read this when you need to debug or tune the effect, not for the basic
implementation steps (those are in `SKILL.md`).

## The core primitive: feDisplacementMap

`feDisplacementMap` shifts every pixel of an input image based on the
color of a corresponding pixel in a "map" image:

- Map's **R channel** -> horizontal displacement
- Map's **G channel** -> vertical displacement
- **128** (mid-grey) = no displacement
- Distance from 128, times the filter's `scale`, = displacement amount
  (in px)

Applied via `backdrop-filter: blur() url(#filter)`, this displaces the
*page content behind the glass element* in real time, as the page
scrolls or content changes underneath. That's refraction.

## The map must be a shape-aware SDF, not a gradient

A plain linear gradient as the map produces a uniform diagonal "shear"
across the whole element - everything behind it shifts the same amount in
the same direction, like a glitch. Real glass only bends light at its
**curved edges**; the flat center transmits the image undistorted.

The correct map is a **signed distance field (SDF)** of the element's
rounded-rectangle shape:

- For each pixel, compute the signed distance to the rounded-rect border
  (negative inside, 0 at the border)
- The **center stays neutral grey** (128, 128) - distance to the edge is
  large, so displacement = 0
- Near the border, displacement ramps up, **in the direction of the
  outward normal** (the gradient of the SDF) - i.e. pixels near the top
  edge get pushed/pulled vertically, pixels near a rounded corner get
  pushed/pulled diagonally outward from that corner, etc.

`scripts/generate-displacement-map.py` computes this with a closed-form
rounded-rect SDF plus a central-difference gradient for the normal
direction, then encodes `(normal * falloff)` into R/G with 128 as the
zero-point.

## scale sign determines lens vs fish-eye

- `scale > 0`: pixels move *toward* where the map points -> **fish-eye /
  pinch**. The image behind the glass appears to recede/shrink near the
  edges.
- `scale < 0`: pixels move *away* from where the map points -> **magnifying
  lens**. The image behind the glass appears to bulge toward the viewer
  near the edges.

Apple's Liquid Glass is the magnifying case: **scale must be negative**.
Typical values: `-30` to `-50`. If you generated the map correctly (SDF,
centered, normals pointing outward) but the bend looks inverted or like a
black hole, you have the sign wrong.

## Chromatic aberration = three displacements + channel recombination

1. Run `feDisplacementMap` three times on `SourceGraphic`, with `scale`,
   `scale - 2`, and `scale + 2` (or similar small offsets)
2. After each pass, use `feColorMatrix` to zero out everything except one
   color channel (R, G, or B) - this isolates "what would the red channel
   look like if displaced by this amount"
3. Recombine the three single-channel results with `feBlend mode="screen"`
   (screen blending with black = 0 in the other channels means each
   result only contributes its own channel)

The result: red, green, and blue are each displaced by a very slightly
different amount, producing the subtle color fringing you see at high-
contrast edges through real glass/lenses.

## Why backdrop-filter url() doesn't break other browsers

`backdrop-filter` accepts a space-separated list of filter functions,
which can include `url(#filter-id)` referencing an SVG filter, alongside
standard functions like `blur()`, `saturate()`, `brightness()`.

CSS parsing is per-declaration: if a browser doesn't understand one value
in a `backdrop-filter` declaration that includes `url()`, it treats the
*entire declaration* as invalid and ignores it - falling back to whatever
`backdrop-filter` declaration came before it. This is why the recommended
CSS pattern is:

```css
.liquid-glass {
  backdrop-filter: blur(10px) saturate(180%);                                   /* fallback */
  backdrop-filter: blur(5px) url(#liquid-lens) saturate(180%) brightness(1.08); /* real effect */
}
```

Browsers that support `url()` in `backdrop-filter` apply the second
(more specific) declaration. Browsers that don't, fail to parse it
entirely and keep using the first. No `@supports` query needed - this is
just normal CSS cascade behavior with progressive enhancement.

## Performance characteristics

- The displacement map is a static PNG, typically 2-5 KB at ~700x64px for
  a navbar-sized element. It's cached like any other static asset.
- The filter runs as part of the GPU compositing pass that
  `backdrop-filter: blur()` already requires - there's no separate render
  target, no per-frame JS, no DOM snapshotting.
- Cost scales with the *area* of the glass element and the complexity of
  what's behind it (same as any `backdrop-filter: blur()`), not with the
  complexity of the filter graph itself. Three extra `feDisplacementMap`
  + `feColorMatrix` + `feBlend` passes for chromatic aberration are
  negligible compared to the blur itself.
