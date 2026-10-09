# Liquid Glass: how it works

Read this when debugging or tuning, not for the basic steps (`SKILL.md`).

## The primitive: feDisplacementMap via backdrop-filter

`feDisplacementMap` moves pixels using a map image:
`P'(x, y) = P(x + scale·(R − 0.5), y + scale·(G − 0.5))`, with R and G in
[0, 1]. A value of 128 means no displacement. Referenced from
`backdrop-filter: blur() url(#id) saturate()`, it displaces whatever is
behind the element. That's refraction.

The filter uses `filterUnits`/`primitiveUnits="userSpaceOnUse"` with
`x=0 y=0 width=W height=H`, and the `feImage` has the same box: the map is
placed 1:1 on the element's border box. This holds at any devicePixelRatio
(verified at DPR 1 and 2 in Chrome).

## The physical displacement profile

The bezel (rim) is a convex squircle height profile
`h(t) = (1 − (1 − t)⁴)^¼ · thickness`, with `t` = distance from the border
/ bezel width (0 at the edge, 1 at the flat plateau).

For each `t`:

1. The surface normal comes from the slope `dh/dd`.
2. A straight-down view ray is refracted into glass (n = `ior`) with
   Snell's law.
3. It travels down `h(t)` to the content plane. Its sideways offset is the
   displacement magnitude.

This gives 256 samples across the bezel. They're normalised by the
maximum, and that maximum (×2, because of the `− 0.5` above) becomes the
filter `scale`.

Per pixel, the rounded-rect outline gives the inside distance to the
border and the outward normal. The vector written into the map is
`−normal · magnitude(distance)`: it points inward, so the rim samples
content from further inside the glass, which reads as magnification near
the edge. Inside the plateau the map is exactly 128 (no bend).

## Specular rim

`buildSpecularMap` writes an alpha mask (white):

- a Gaussian edge line about 1.2 px wide, plus a fainter second line just
  inside it
- an exponential inner glow over about 0.6 × bezel
- both scaled by `|normal · light|^1.6`: full strength on the side facing
  the light, 70 % on the opposite side, and an ambient floor of 0.3

It's drawn at devicePixelRatio resolution so the edge line stays crisp,
and composited with `mix-blend-mode: plus-lighter`.

## Tint mask

The tint layer is masked by a smoothstep over the bezel: 25 % opacity at
the edge and 100 % on the plateau. The rim therefore shows the refracted
backdrop brighter and clearer than the centre, which is a large part of
the Apple look, especially for dark panels.

## Dispersion

The displacement runs three times, at `scale·(1 + d)`, `scale` and
`scale·(1 − d)`. Each result is reduced to one channel with
`feColorMatrix` and the three are summed with `feComposite
operator="arithmetic" k2=1 k3=1`. Set `dispersion = 0` for a single pass.

## Backdrop roots (the #1 reason for "no refraction")

A `backdrop-filter` only sees content up to the nearest Backdrop Root
ancestor: an element with `filter`, `opacity < 1`, `mask`, `clip-path`,
`backdrop-filter`, `mix-blend-mode`, or children that force it to be an
isolated blend group. Beyond that the backdrop is empty, the displacement
moves transparent pixels, and the page just shows through the glass,
unbent.

That's why the component puts `backdrop-filter` on its own root (its
specular layer uses `plus-lighter`, which would otherwise isolate the
parent). It's also why glass-on-glass must be built from siblings.

## Browser support

Only Blink draws SVG `url()` filters in `backdrop-filter`. WebKit (Safari
and every iOS browser) and Gecko parse the value but don't render it, so
the component sniffs Blink and gives other engines a frosted
blur + tint + specular fallback.

## Cost

Maps are generated once per (size, radius, bezel, thickness, ior,
profile, light, DPR) and cached in a small LRU, so identical controls
share them. A 780×420 panel takes about 45 ms in total (displacement
8 ms, specular at DPR 2 about 22 ms, PNG encoding about 11 ms). A 64 px
pill takes a few ms. After that, rendering is the browser's normal
backdrop-filter pass.
