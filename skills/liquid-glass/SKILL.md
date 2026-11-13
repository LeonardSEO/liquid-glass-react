---
name: liquid-glass
description: Implement Apple-style "Liquid Glass" (iOS 26 / macOS 26) for web UI - navbars, tab bars, pills, buttons, cards, sheets, modals - with physically-based rim refraction (Snell's law over a squircle bezel), frosted centre, angle-dependent specular rim and touch interaction, using a React component that generates SVG displacement maps per element and applies them via backdrop-filter. No WebGL, no html2canvas, no per-frame JS. Use whenever the user asks for "liquid glass", Apple-style glass UI, glassmorphism that should actually refract, or says an existing glass effect "is just blur", bends in the wrong place, shows no bend at all, or looks like a fish-eye.
---

# Liquid Glass

`assets/` holds the whole implementation, generated from the package source:

- `LiquidGlass.tsx`, `useLiquidGlass.tsx`: the component and the hook
- `maps.ts`: physics + map generation (displacement, specular rim, tint mask)
- `liquid-glass.css`: the layers and the light/dark looks

Read `references/theory.md` only when debugging or tuning.

## Step 1 - Install

Preferred: install the package and import its stylesheet once (e.g. in
the root layout):

```bash
npm install @vepando/liquid-glass-react
```

```tsx
import "@vepando/liquid-glass-react/style.css"
import { LiquidGlass } from "@vepando/liquid-glass-react"
```

The bundle is marked `"use client"`, so it can be used directly from
Next.js server components.

Alternative (no dependency): copy all of `assets/` into one folder in the
project, import from its `index.ts`, and import `liquid-glass.css` once.

## Step 1b - Need real controls or your own element?

Don't wrap interactive controls in the `div` component. Use one of these from
the package (1.1 or later):

- **Ready-made components:** Button, Switch, Slider, Segmented Control,
  Toolbar, Input, Menu, Tabs, Tab Bar, Dialog and Card install as source in
  shadcn projects with Tailwind v4. Use them before building a control by hand,
  for example:
  `npx shadcn@latest add https://leonardseo.github.io/liquid-glass-react/r/glass-switch.json`
  The install names are `glass-` plus the component in kebab case
  (`glass-segmented-control`, `glass-tab-bar`, …).
- **Your own element:** `useLiquidGlass(options)` returns `ref`, `rootProps`
  and `wrap(children)`. Put all three on one element, or use
  `<LiquidGlass render={<button type="button" />}>`.
- **Tokens:** `radius="auto"` reads the CSS `border-radius`. `--lg-bezel`,
  `--lg-thickness`, `--lg-blur`, `--lg-saturation` and `--lg-tint` set the
  material from CSS.

Rules that apply to all of them:

- One layer of glass per stack: nested glass has nothing to refract. Give
  controls on a glass surface `--lg-backdrop-override: none` (the components do
  this themselves).
- Stick to Apple's options: `variant` (`regular`, `clear`, `identity`), `tint`,
  `radius` and `interactive`. Dark glass comes from a `dark` class or
  `data-theme="dark"` on the element or an ancestor.
- Never declare `backdrop-filter` on `.lg` in CSS, because minifiers can reduce
  it to the `-webkit-` form, which Chromium ignores. Set
  `--lg-backdrop-override` instead.

## Step 2 - Wrap the element

```tsx
import { LiquidGlass } from "@vepando/liquid-glass-react"

<LiquidGlass radius={999} style={{ height: 64 }}>
  <nav className="h-full flex items-center px-6">…</nav>
</LiquidGlass>
```

- `radius` must match the visual corner radius (999 = pill/circle). The
  component applies it as `border-radius` itself.
- Give the element a real size (height/width via class or style). The map
  is generated for the measured size and regenerated on resize.
- `interactive` for buttons.

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
| Too milky / too clear | Variant | Switch between `variant="regular"` and `"clear"` |
| Fixed-size element, want zero JS | - | `scripts/generate-displacement-map.py` + use the printed `scale` |
