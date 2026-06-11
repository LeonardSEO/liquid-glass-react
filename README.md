# Liquid Glass for React / Next.js

Real edge refraction for glass UI - the way Apple's "Liquid Glass" material
(iOS 26 / macOS 26) actually works, not just `backdrop-filter: blur()` in a
rounded box.

```css
.liquid-glass {
  backdrop-filter: blur(5px) url(#liquid-lens) saturate(180%) brightness(1.08);
}
```

That's the entire runtime cost: **one CSS declaration** plus a tiny
(2-5 KB) PNG. No WebGL, no `html2canvas`, no per-frame JavaScript, no
layout thrashing. It works in a server-rendered Next.js app and degrades
gracefully to a plain blur in browsers that don't support SVG filters in
`backdrop-filter`.

---

## Why this exists

Search for "liquid glass css" or "liquid glass react" and you'll find two
kinds of results:

1. **Blur-in-a-pill.** `backdrop-filter: blur(20px)` on a
   `border-radius: 9999px` element with a translucent background. This
   looks fine from a distance, but it is **not** what Liquid Glass does.
   Real glass *bends* the image behind it - text and shapes near the edge
   of the glass visibly warp and magnify. A flat blur never does this, no
   matter how you tune it.

2. **WebGL / canvas recreations.** Several projects render the whole page
   (or a screenshot of it) into a `<canvas>` or WebGL texture and apply a
   real lens-distortion shader to it. This *does* produce real refraction,
   but at a real cost: extra render passes, `html2canvas`-style DOM
   snapshots, large JS bundles, and a noticeable performance hit on pages
   with a lot of content - exactly the kind of "now my whole site is slow"
   tradeoff most marketing/product sites can't afford for a navbar.

This repo documents a **third approach**: a single hidden SVG
`<filter>` using `feDisplacementMap`, driven by a small pre-generated
displacement map image, applied via the standards-based
`backdrop-filter: blur() url(#filter)` syntax. It gets you real refraction
- including chromatic aberration at the edges - using only CSS and one
small image. It's the same primitive the browser already uses for
`backdrop-filter: blur()`, so there's no new rendering pipeline to pay for.

---

## How it works

### 1. Refraction is a displacement map, not a blur

`feDisplacementMap` is an SVG filter primitive that shifts every pixel of
an input image based on the color values of a second "map" image:

- The map's **red channel** controls horizontal displacement
- The map's **green channel** controls vertical displacement
- A value of **128** (mid-grey) means "no displacement"
- Values above/below 128 shift the pixel right/left or down/up,
  proportional to a `scale` factor

If you apply this filter to the page's own backdrop (via
`backdrop-filter: ... url(#filter)`), you get real-time pixel-shifting of
whatever is behind the glass element - which *is* refraction.

### 2. The map has to follow the shape of the glass (SDF)

The naive approach is a simple linear gradient as the displacement map.
**Don't do this** - it produces a uniform diagonal "shear" across the
entire element, which looks like a glitch, not glass.

Real glass only bends light **at its curved edges**. The flat center of a
pane of glass doesn't distort what's behind it at all. So the displacement
map needs to be:

- **Neutral grey (128, 128) in the center** - no displacement where the
  glass is "flat"
- **Ramping toward the edges**, in a direction that follows the element's
  actual border-radius - i.e. an [SDF](https://en.wikipedia.org/wiki/Signed_distance_function)
  (signed distance field) of the rounded-rectangle shape, not a plain
  gradient

[`scripts/generate-displacement-map.py`](scripts/generate-displacement-map.py)
generates exactly this: for every pixel, it computes the signed distance
to the rounded-rect border and the outward normal direction, and encodes
"how far from the edge" and "which way is the edge" into the R/G channels.
The center comes out flat grey; the rounded corners and edges get a
radial-ish push outward.

| SDF map (correct) | Linear gradient (wrong) |
| --- | --- |
| Neutral center, displacement follows the rounded shape, bends only at the rim | Uniform diagonal shift across the whole element - looks like a UI bug |

### 3. The scale must be negative

`feDisplacementMap`'s `scale` value controls the strength *and direction*
of the bend:

- **Positive scale** pushes pixels in the direction the map encodes -
  this produces a **fish-eye / pinch** distortion (like looking through
  the wrong end of a telescope).
- **Negative scale** pulls pixels the other way - this produces a
  **magnifying lens** effect, where content behind the glass appears to
  bulge *toward* the viewer at the edges. This is the Apple Liquid Glass
  look.

If your refraction looks "inside out" - distorting the wrong way, or
shrinking instead of magnifying - flip the sign of `scale`.

### 4. Chromatic aberration sells it

Real glass refracts different wavelengths of light by slightly different
amounts. You can fake this cheaply by running the displacement **three
times** at slightly different `scale` values, isolating the red, green,
and blue channels of each result with `feColorMatrix`, and recombining
them with `feBlend mode="screen"`. The difference is subtle (a couple of
pixels of red/blue fringing at high-contrast edges) but it's a big part of
why this reads as "glass" instead of "warped screenshot".

### 5. Browser support is a non-issue

`backdrop-filter: blur(10px) url(#my-filter) saturate(180%)` is valid CSS.
Browsers that don't support `url()` filter references inside
`backdrop-filter` (Safari and Firefox, as of writing) simply ignore that
specific value and fall back to the previous valid `backdrop-filter`
declaration - which is why the CSS in this repo declares a plain
`blur() saturate()` *first*, and the lens version *second*. No
`@supports` query needed; it's automatic graceful degradation.

---

## Quick start

### 1. Generate a displacement map for your shape

```bash
pip install -r scripts/requirements.txt
python3 scripts/generate-displacement-map.py \
  --width 700 --height 64 --radius 32 --mode sdf \
  --output public/liquid-lens-map.png
```

- `--width` / `--height`: roughly the on-screen size of your glass element
  (the map gets stretched to fill it, so exact pixels don't matter - the
  *aspect ratio* and corner-radius proportion do)
- `--radius`: should match your element's CSS `border-radius` in pixels
- `--rim`: (optional) how far the bend extends inward from the edge, in
  px. Defaults to `--radius`. Increase for a "thicker" glass edge.

Regenerate this whenever you change the element's shape or aspect ratio
significantly.

### 2. Render the SVG filter once, server-side

```tsx
// app/layout.tsx
import { LiquidGlassFilter } from "@/components/LiquidGlassFilter"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <LiquidGlassFilter />
        {children}
      </body>
    </html>
  )
}
```

Render it **once**, in a server component, near the root of your app -
not inside the client component that uses it. See
["Common pitfalls"](#common-pitfalls) for why.

### 3. Apply the CSS class

```tsx
import "./liquid-glass.css"

<nav className="liquid-glass rounded-full h-16 px-6 flex items-center">
  ...
</nav>
```

That's it. [`components/liquid-glass.css`](components/liquid-glass.css)
contains the full rule plus light/dark CSS custom properties you can
override per-theme. [`examples/LiquidGlassPill.tsx`](examples/LiquidGlassPill.tsx)
shows a complete floating navbar pill.

---

## API reference

### `<LiquidGlassFilter />`

Server-renderable component that outputs the hidden `<svg><filter>`.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `id` | `string` | `"liquid-lens"` | Filter id. Reference it from CSS as `url(#id)`. |
| `mapSrc` | `string` | `"/liquid-lens-map.png"` | Path to the generated displacement map. |
| `scale` | `number` | `-42` | Bend strength/direction. **Must be negative** for a magnifying lens (see [why](#3-the-scale-must-be-negative)). Larger magnitude = stronger bend. |
| `chromaticAberration` | `boolean` | `true` | Adds the 3-pass color-fringing effect. Set `false` for a slightly cheaper, neutral-color bend. |

### CSS custom properties (`liquid-glass.css`)

| Variable | Purpose | Typical range |
| --- | --- | --- |
| `--lg-tint` | Background color/alpha behind the glass | low alpha, e.g. `rgba(255,255,255,0.5)` |
| `--lg-rim-border` | 1px outer border color | low-alpha white/black |
| `--lg-rim-brightness` | `brightness()` applied to the refracted backdrop | `1.0`-`1.2` |
| `--lg-specular` / `--lg-specular-side` | Inset highlight colors (top/bottom and left/right edges) | low-alpha white |
| `--lg-sheen` | Soft overlay gradient for a top/bottom light sheen | low-alpha white |
| `--lg-drop-alpha` | Drop shadow opacity | `0.1`-`0.4` |

Override these per-theme (e.g. inside `[data-theme="dark"]` or
`@media (prefers-color-scheme: dark)`) - the example file already includes
a dark-mode block.

---

## Tuning the effect

- **Bend too subtle / too strong**: adjust `scale` on `<LiquidGlassFilter>`.
  Start around `-30` to `-50`; go higher in magnitude for a more dramatic
  "blob lens" look, lower for a barely-there edge highlight.
- **Bend in the wrong place**: regenerate the displacement map with
  `--radius` matching your element's actual `border-radius`, and
  `--width`/`--height` matching its aspect ratio.
- **Glass feels "thin"**: increase `--rim` when generating the map (more
  of the element participates in the bend), and/or increase
  `--lg-rim-brightness` slightly.
- **Performance**: the displacement map is a static PNG (a few KB),
  cached like any other image. The filter itself runs on the GPU as part
  of the existing backdrop-filter compositing pass - there's no additional
  per-frame cost beyond what a plain `blur()` already costs.

---

## Common pitfalls

- **Hydration mismatch from the SVG filter.** If `<LiquidGlassFilter />`
  is rendered inside a `"use client"` component, React's client-side
  render can produce a slightly different SVG tree than the server did on
  first paint, triggering a hydration error. Fix: render it from a server
  component (e.g. your root layout), not from the client island that uses
  the glass effect.
- **Positive `scale` looks like a glitch, not glass.** This is the fish-eye
  case - flip the sign (see [above](#3-the-scale-must-be-negative)).
- **Linear-gradient displacement maps cause uniform shear.** If the whole
  element looks like it's "sliding" diagonally rather than bending at the
  edges, your map isn't following the element's shape - regenerate with
  `--mode sdf`.
- **Effect missing entirely in Safari/Firefox.** Expected - those browsers
  don't yet support `url()` references inside `backdrop-filter` and will
  show the plain-blur fallback declaration instead. Make sure that
  fallback declaration comes *before* the `url(#liquid-lens)` one in your
  CSS, and that it looks acceptable on its own.
- **`next/image` quality / `images.qualities` warnings** are unrelated to
  this technique - they're a general Next.js 16 image-optimization config
  requirement, not specific to the displacement map PNG (which is served
  as a plain static asset, not through `next/image`).

---

## Browser support

| Browser | Behavior |
| --- | --- |
| Chrome / Edge / other Chromium | Full effect: blur + SVG lens refraction + chromatic aberration |
| Safari | Falls back to plain `blur() saturate()` (no `url()` filter support in `backdrop-filter` yet) |
| Firefox | Same fallback as Safari |
| No `backdrop-filter` support at all | Solid near-opaque background via `@supports not (...)` |

---

## Repository layout

```
.
├── components/
│   ├── LiquidGlassFilter.tsx   # the SVG <filter> component
│   └── liquid-glass.css        # the .liquid-glass CSS rule + theming vars
├── examples/
│   └── LiquidGlassPill.tsx      # example floating navbar pill
├── scripts/
│   ├── generate-displacement-map.py
│   └── requirements.txt
├── public/
│   ├── liquid-lens-map.png             # example SDF map (700x64, radius 32)
│   └── liquid-lens-map-linear-example.png  # "wrong" map, for comparison
└── skills/
    └── liquid-glass/            # self-contained skill for AI coding agents
        ├── SKILL.md
        ├── scripts/
        ├── assets/
        └── references/
```

## For AI coding tools

The [`skills/liquid-glass/`](skills/liquid-glass/) directory is a
self-contained "skill": a `SKILL.md` with step-by-step implementation
instructions plus its own copies of the script, component, and CSS, meant
to be handed directly to an AI coding assistant (e.g. as a Claude Code /
Claude Agent skill, or pasted as context for any other coding agent). It
captures the same technique as the rest of this repo, organized for an
agent to follow end-to-end - including a troubleshooting table for the
"fish-eye instead of magnifying lens" and "uniform shear" failure modes
that are the most common mistakes when implementing this from scratch.

## Related projects

This repo focuses on the SVG-displacement-map technique specifically
because it has the smallest footprint of the approaches that produce real
refraction. If you need more advanced effects (full lens distortion of
arbitrary content, animated liquid blobs, drag-and-merge glass shapes),
look at WebGL/canvas-based libraries - they do more, at the cost of extra
JS and render passes. This technique is aimed at the common case: a
navbar, toolbar, card, or modal that needs to *look* like glass without
becoming the heaviest thing on the page.

---

## License

MIT - see [LICENSE](LICENSE).
