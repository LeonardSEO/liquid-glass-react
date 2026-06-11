#!/usr/bin/env python3
"""Generate a displacement map for the Liquid Glass SVG filter.

The map encodes a 2D displacement vector per pixel:
  - R channel = X displacement (128 = none, <128 = shift left, >128 = shift right)
  - G channel = Y displacement (128 = none, <128 = shift up, >128 = shift down)

In "sdf" mode (the default, and the one you want) the map follows the actual
rounded-rectangle silhouette of the glass element: the center is neutral grey
(no displacement at all) and the displacement ramps up toward the rounded
edges, pointing outward along the shape's normal. This is what makes the
backdrop bend and magnify only at the curved rim, the way a real glass /
acrylic edge refracts light.

In "linear" mode the map is a plain horizontal/vertical gradient across the
whole image. It is included only for comparison: it produces a uniform
"shear" across the entire element instead of a lens effect, which is the
single most common mistake when people try to recreate this technique.

Usage:
    python3 generate-displacement-map.py \\
        --width 700 --height 64 --radius 32 --mode sdf \\
        --output public/liquid-lens-map.png

The --width/--height/--radius values should roughly match the on-screen
size and border-radius of the element you're applying the filter to.
The map is stretched to fill the element (preserveAspectRatio="none" in
the SVG <feImage>), so an exact pixel match isn't required - just a
similar aspect ratio and corner radius proportion.
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


def smoothstep(edge0, edge1, x):
    t = np.clip((x - edge0) / (edge1 - edge0), 0, 1)
    return t * t * (3 - 2 * t)


def generate_sdf_map(width, height, radius, rim):
    y, x = np.mgrid[0:height, 0:width].astype(np.float64)
    sdf = rounded_rect_sdf(x, y, width, height, radius)

    # Central-difference gradient of the SDF gives the outward normal
    # direction at every point - i.e. "which way is the nearest edge".
    gx = rounded_rect_sdf(x + 1, y, width, height, radius) - rounded_rect_sdf(x - 1, y, width, height, radius)
    gy = rounded_rect_sdf(x, y + 1, width, height, radius) - rounded_rect_sdf(x, y - 1, width, height, radius)
    glen = np.sqrt(gx**2 + gy**2)
    glen[glen == 0] = 1
    nx = gx / glen
    ny = gy / glen

    # How close is this pixel to the edge, normalized to the "rim" band.
    # 0 = deep in the flat center (no displacement), 1 = right at the edge.
    edge_dist = np.clip(-sdf, 0, None)
    factor = 1 - smoothstep(0, rim, edge_dist)

    r = np.clip(128 + nx * factor * 127, 0, 255)
    g = np.clip(128 + ny * factor * 127, 0, 255)
    b = np.full_like(r, 128)
    a = np.full_like(r, 255)

    return np.stack([r, g, b, a], axis=-1).astype(np.uint8)


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
    parser.add_argument("--rim", type=int, default=None, help="How far the bend extends inward from the edge, in px (default: same as --radius)")
    parser.add_argument("--mode", choices=["sdf", "linear"], default="sdf", help="sdf = follow the rounded shape (correct), linear = plain gradient (for comparison only)")
    parser.add_argument("--output", default="liquid-lens-map.png", help="Output PNG path")
    args = parser.parse_args()

    rim = args.rim if args.rim is not None else args.radius

    if args.mode == "sdf":
        data = generate_sdf_map(args.width, args.height, args.radius, rim)
    else:
        data = generate_linear_map(args.width, args.height)

    Image.fromarray(data).save(args.output)
    print(f"Wrote {args.output} ({args.width}x{args.height}px, mode={args.mode}, radius={args.radius}, rim={rim})")


if __name__ == "__main__":
    main()
