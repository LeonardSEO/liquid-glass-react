---
name: liquid-glass
description: Implement Apple-style "Liquid Glass" (iOS 26 / macOS 26) for web UI - navbars, tab bars, pills, buttons, cards, sheets, modals - with physically-based rim refraction (Snell's law over a squircle bezel), frosted centre, angle-dependent specular rim and touch interaction, using a React component that generates SVG displacement maps per element and applies them via backdrop-filter. No WebGL, no html2canvas, no per-frame JS. Use whenever the user asks for "liquid glass", Apple-style glass UI, glassmorphism that should actually refract, or says an existing glass effect "is just blur", bends in the wrong place, shows no bend at all, or looks like a fish-eye.
---

# Liquid Glass

Three files in `assets/` make up the whole implementation:

- `LiquidGlass.tsx`: the React component (client component, SSR-safe)
- `liquid-glass-maps.ts`: physics + map generation (displacement,
  specular rim, tint mask)
- `liquid-glass.css`: the layers and the light/dark tints

Read `references/theory.md` only when debugging or tuning.

## Step 1 - Install

Preferred: install the package and import its stylesheet once (e.g. in
the root layout):

```bash
npm install liquidglass-react
```

```tsx
import "liquidglass-react/style.css"
import { LiquidGlass } from "liquidglass-react"
```

The bundle is marked `"use client"`, so it can be used directly from
Next.js server components.

Alternative (no dependency): copy the three files from `assets/` into
the project's components directory, next to each other, and import from
there. That copy imports its own CSS.

## Step 2 - Wrap the element

```tsx
import { LiquidGlass } from "liquidglass-react"

<LiquidGlass radius={999} style={{ height: 64 }}>
  <nav className="h-full flex items-center px-6">…</nav>
</LiquidGlass>
```

- `radius` must match the visual corner radius (999 = pill/circle). The
  component applies it as `border-radius` itself.
- Give the element a real size (height/width via class or style). The map
  is generated for the measured size and regenerated on resize.
- `tint="dark"` for dark sheets/panels; `interactive` for buttons.
- Leave `bezel`/`thickness` on auto unless you need to tune them.

## Step 3 - Layout rules that make or break the effect

1. **No backdrop root between the glass and the content it should
   refract.** Ancestors with `filter`, `opacity < 1`, `mask`,
   `clip-path`, `mix-blend-mode`, `backdrop-filter` or `will-change` on
   those cut off the backdrop, and the glass then shows no bend.
   `overflow: hidden` and `transform` are fine.
2. **Glass on glass = siblings, not nesting.** To put a glass element over
   another (e.g. a selection droplet over a tab bar), render it as a
   sibling absolutely positioned on top, not as a child.
3. The glass needs something behind it to bend. Test it over images,
   text or stripes, not a flat colour.

## Step 4 - Verify in Chrome

Put text or stripes behind the glass edge:

- **Correct**: centre undistorted (just frosted), rim magnifies and
  stretches the content towards the edge, thin bright edge line strongest
  top-left/bottom-right, faint colour fringe.
- **No bend at all, glass looks like a tinted window**: backdrop root
  (Step 3), or not a Blink browser.
- **Bend in the wrong place / seams**: `radius` prop doesn't match the
  shape, or the element is transformed to a different size (scale
  transforms are fine for short animations).

Safari/iOS/Firefox show a frosted fallback (blur + tint + specular). This
is expected: only Blink renders SVG filters in `backdrop-filter`.

## Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| No refraction in Chrome, page visible "through" the glass | Backdrop root ancestor | Remove the filter/opacity/blend from the ancestor, or move the glass out of it |
| Nested glass looks dark/empty | Inner glass is a child of outer glass | Make it a sibling positioned over it |
| Too strong / too weak bend | Thickness | `thickness` (or `refraction` multiplier) |
| Rainbow edges too strong | Dispersion | Lower `dispersion` (0 disables) |
| Too milky / too clear | Tint, blur | `tint="rgba(255,255,255,.2)"`, `blur` |
| Fixed-size element, want zero JS | - | `scripts/generate-displacement-map.py` + use the printed `scale` |
