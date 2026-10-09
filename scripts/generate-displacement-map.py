#!/usr/bin/env python3
"""Generate a displacement map for the Liquid Glass SVG filter.

The map encodes a 2D displacement vector per pixel:
  - R channel = X displacement (128 = none, <128 = shift left, >128 = shift right)
  - G channel = Y displacement (128 = none, <128 = shift up, >128 = shift down)

In "sdf" mode (the default, and the one you want) the map is physically
based: the glass rim (the "bezel") is modelled as a convex squircle surface,
and for every distance from the border a straight-down view ray is refracted
with Snell's law. The sideways offset where it lands on the content below is
written along the inward normal of the rounded-rect outline. The flat centre
stays neutral grey (no bend); the rim magnifies what is behind it.

In "linear" mode the map is a plain gradient - included only to show the
common "uniform shear" mistake.

Usage:
    python3 generate-displacement-map.py \\
        --width 700 --height 64 --radius 32 \\
        --output public/liquid-lens-map.png

Generate the map at the element's EXACT CSS size and use the printed
`scale` - a stretched map puts the bend in the wrong place. If the element
size is dynamic, use the runtime <LiquidGlass> component instead, which
regenerates the map whenever the element resizes.
"""

import argparse

import numpy as np
from PIL import Image


def rounded_rect_sdf(x, y, w, h, r):
    """Signed distance to a rounded rectangle of size (w, h) and corner radius r.

    Negative inside the shape, zero on the border, positive outside.
    """
    cx, cy = w / 2.0, h / 2.0
    qx = np.abs(x - cx) - (cx - r)
    qy = np.abs(y - cy) - (cy - r)
    outside = np.sqrt(np.clip(qx, 0, None) ** 2 + np.clip(qy, 0, None) ** 2)
    inside = np.minimum(np.maximum(qx, qy), 0)
    return outside + inside - r


def squircle(t):
    """Convex squircle surface profile: 0 at the outer edge, 1 on the plateau."""
    t = np.clip(t, 0, 1)
    return (1 - (1 - t) ** 4) ** 0.25


def refraction_profile(bezel, thickness, ior, samples=256):
    """Sideways offset (px) of a straight-down view ray refracted by the rim.

    For each distance from the border (across the bezel) we take the surface
    slope of the squircle profile, refract the ray with Snell's law and
    follow it down through the glass to the content plane underneath.
    Positive = the pixel shows content from further inward (magnification).
    """
    t = (np.arange(samples) + 0.5) / samples
    h = 1e-3
    z = squircle(t) * thickness
    slope = (squircle(t + h) - squircle(t - h)) / (2 * h) * (thickness / bezel)
    inv = 1 / np.sqrt(slope**2 + 1)
    nx, nz = -slope * inv, inv
    eta = 1 / ior
    cosi = nz
    k = np.clip(1 - eta**2 * (1 - cosi**2), 0, None)
    f = eta * cosi - np.sqrt(k)
    tx = f * nx
    tz = -eta + f * nz
    return (tx / -tz) * z


def generate_sdf_map(width, height, radius, bezel, thickness, ior):
    radius = min(radius, width / 2, height / 2)
    bezel = max(1, min(bezel, width / 2, height / 2))
    y, x = np.mgrid[0:height, 0:width].astype(np.float64) + 0.5
    sdf = rounded_rect_sdf(x, y, width, height, radius)

    # Central-difference gradient of the SDF = outward normal of the shape.
    gx = rounded_rect_sdf(x + 0.5, y, width, height, radius) - rounded_rect_sdf(x - 0.5, y, width, height, radius)
    gy = rounded_rect_sdf(x, y + 0.5, width, height, radius) - rounded_rect_sdf(x, y - 0.5, width, height, radius)
    glen = np.sqrt(gx**2 + gy**2)
    glen[glen == 0] = 1
    nx, ny = gx / glen, gy / glen

    profile = refraction_profile(bezel, thickness, ior)
    max_disp = float(np.abs(profile).max()) or 1.0
    dist = -sdf  # inside distance to the border
    idx = np.clip((dist / bezel * len(profile)).astype(int), 0, len(profile) - 1)
    mag = np.where((dist >= 0) & (dist < bezel), profile[idx] / max_disp, 0.0)

    # Inward (-normal) = sample from further inside the glass.
    r = np.clip(128 - nx * mag * 127, 0, 255)
    g = np.clip(128 - ny * mag * 127, 0, 255)
    b = np.full_like(r, 128)
    a = np.full_like(r, 255)
    # feDisplacementMap: P'(x) = P(x + scale * (C - 0.5)), so scale = 2 * max offset.
    return np.stack([r, g, b, a], axis=-1).astype(np.uint8), max_disp * 2


def generate_linear_map(width, height):
    y, x = np.mgrid[0:height, 0:width].astype(np.float64)
    r = (x / max(width - 1, 1)) * 255
    g = (y / max(height - 1, 1)) * 255
    b = np.full_like(r, 128)
    a = np.full_like(r, 255)
    return np.stack([r, g, b, a], axis=-1).astype(np.uint8)


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--width", type=int, default=700, help="Map width in px (default: 700)")
    parser.add_argument("--height", type=int, default=64, help="Map height in px (default: 64)")
    parser.add_argument("--radius", type=int, default=32, help="Corner radius in px - match your element's border-radius (default: 32)")
    parser.add_argument("--bezel", type=float, default=None, help="Width of the curved rim in px (default: a quarter of the short side, capped at --radius)")
    parser.add_argument("--thickness", type=float, default=None, help="Glass height in px (default: 1.5 x bezel). Taller = stronger bend")
    parser.add_argument("--ior", type=float, default=1.5, help="Index of refraction (default: 1.5, glass)")
    parser.add_argument("--mode", choices=["sdf", "linear"], default="sdf", help="sdf = follow the rounded shape (correct), linear = plain gradient (for comparison only)")
    parser.add_argument("--output", default="liquid-lens-map.png", help="Output PNG path")
    args = parser.parse_args()

    bezel = args.bezel if args.bezel is not None else max(6, min(min(args.width, args.height) * 0.25, args.radius, 56))
    thickness = args.thickness if args.thickness is not None else bezel * 1.5

    if args.mode == "sdf":
        data, scale = generate_sdf_map(args.width, args.height, args.radius, bezel, thickness, args.ior)
        Image.fromarray(data).save(args.output)
        print(f"Wrote {args.output} ({args.width}x{args.height}px, radius={args.radius}, bezel={bezel:g}, thickness={thickness:g})")
        print(f'Use it with: <feDisplacementMap scale="{scale:.1f}" xChannelSelector="R" yChannelSelector="G" />')
    else:
        Image.fromarray(generate_linear_map(args.width, args.height)).save(args.output)
        print(f"Wrote {args.output} (linear comparison map - not for real use)")


if __name__ == "__main__":
    main()
