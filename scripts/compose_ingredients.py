"""Turn an AI-generated "bottle + ingredients on a light background" scene
into a transparent PNG that's pixel-perfect with the product's existing
cutout bottle, matching the pipeline already used for patchouli-01:

1. Crop the raw AI scene to the cutout's aspect ratio (3:2, 1536x1024),
   cropping side margins only so the vertical framing / bottle scale is
   preserved as closely as possible.
2. Color-key the near-white studio background to transparent with a sharp
   cutoff (no blur/morphology — soft photographic shadows in the source
   otherwise leave halo artifacts once keyed).
3. Alpha-composite the REAL cutout bottle (already a clean transparent
   PNG) on top, at its native full-canvas position. This guarantees the
   bottle is pixel-identical to the base product shot, regardless of how
   well the AI scene's own bottle lines up — only the ingredients peeking
   around/behind it need to look right.

Usage:
    python scripts/compose_ingredients.py <slug> <raw_scene_path>

Writes public/assets/products/<slug>-ingredients.png
"""

import sys
from pathlib import Path

from PIL import Image

CANVAS_W, CANVAS_H = 1536, 1024
TARGET_RATIO = CANVAS_W / CANVAS_H  # 1.5

# Near-white background threshold — sharp cutoff, no anti-aliased edge
# blending, so we don't reintroduce the halo/"white shadow" artifacts from
# earlier attempts. Pixels with all channels >= this become fully
# transparent; everything else stays fully opaque.
WHITE_THRESHOLD = 246


def crop_to_ratio(img: Image.Image) -> Image.Image:
    w, h = img.size
    ratio = w / h
    if ratio > TARGET_RATIO:
        # too wide — crop the sides, keep full height
        new_w = round(h * TARGET_RATIO)
        x0 = (w - new_w) // 2
        img = img.crop((x0, 0, x0 + new_w, h))
    elif ratio < TARGET_RATIO:
        # too tall — crop top/bottom, keep full width
        new_h = round(w / TARGET_RATIO)
        y0 = (h - new_h) // 2
        img = img.crop((0, y0, w, y0 + new_h))
    return img.resize((CANVAS_W, CANVAS_H), Image.LANCZOS)


def key_out_white(img: Image.Image) -> Image.Image:
    img = img.convert("RGBA")
    px = img.load()
    w, h = img.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if r >= WHITE_THRESHOLD and g >= WHITE_THRESHOLD and b >= WHITE_THRESHOLD:
                px[x, y] = (r, g, b, 0)
    return img


def main() -> None:
    slug, raw_path = sys.argv[1], sys.argv[2]
    products_dir = Path("public/assets/products")
    cutout_path = products_dir / f"{slug}-cutout.png"
    out_path = products_dir / f"{slug}-ingredients.png"

    if not cutout_path.exists():
        raise SystemExit(f"Missing cutout for compositing: {cutout_path}")

    raw = Image.open(raw_path)
    scene = crop_to_ratio(raw)
    scene = key_out_white(scene)

    cutout = Image.open(cutout_path).convert("RGBA")
    if cutout.size != (CANVAS_W, CANVAS_H):
        raise SystemExit(f"Unexpected cutout size {cutout.size} for {slug}")

    result = scene.copy()
    result.alpha_composite(cutout)
    result.save(out_path)
    print(f"Wrote {out_path} ({result.size[0]}x{result.size[1]})")


if __name__ == "__main__":
    main()
