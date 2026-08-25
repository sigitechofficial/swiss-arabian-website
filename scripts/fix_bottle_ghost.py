"""Fix a "double bottle" ghosting artifact in already-generated
`<slug>-ingredients.png` files.

Root cause: `compose_ingredients.py` color-keys the AI scene's near-white
*background* to transparent, then pastes the real cutout bottle on top.
But the AI scene draws its OWN bottle too, and that bottle isn't
near-white, so it survives the color-key as fully opaque pixels. Ornate
bottle caps (lattice/knot metalwork) have lots of small transparent gaps
in the real cutout's alpha channel — and through those gaps, the AI's own
(slightly misaligned) bottle/cap peeks out from underneath, reading as a
faint doubled outline right where the cap detail is.

Fix: before re-compositing the real cutout on top, erase a slightly
DILATED version of the cutout's silhouette from the existing ingredients
image first. Dilating (growing the mask a few pixels beyond the bottle's
exact edge) makes sure it also blanks out the AI bottle showing through
any small internal gaps in the real cutout's lattice, not just the outer
outline. Then paste the pixel-perfect cutout back on top of that now-empty
region — no ghost left to show through.

Usage:
    python scripts/fix_bottle_ghost.py <slug> [<slug> ...]
    python scripts/fix_bottle_ghost.py --all
"""

import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

PRODUCTS_DIR = Path("public/assets/products")

ALL_SLUGS = [
    "rose-01",
    "shaghaf-oud-ahmar",
    "vanilla-01",
    "incense-01",
    "shaghaf-nectar-blush",
    "patchouli-01",
    "shaghaf-oud-aswad",
    "tobacco-01",
    "shaghaf-oud-tonka",
    "shaghaf-oud-azraq",
    "shaghaf-oud-elixir",
]

# How far (px) to grow the cutout's silhouette before erasing it from the
# ingredients scene. Needs to be generous enough to cover gaps in ornate
# cap lattices, but small enough to not eat into nearby ingredients.
DILATE_PX = 16


def fix_one(slug: str) -> None:
    cutout_path = PRODUCTS_DIR / f"{slug}-cutout.png"
    ingredients_path = PRODUCTS_DIR / f"{slug}-ingredients.png"

    if not cutout_path.exists() or not ingredients_path.exists():
        print(f"skip {slug}: missing cutout or ingredients file")
        return

    cutout = Image.open(cutout_path).convert("RGBA")
    scene = Image.open(ingredients_path).convert("RGBA")
    if scene.size != cutout.size:
        print(f"skip {slug}: size mismatch {scene.size} vs {cutout.size}")
        return

    alpha = cutout.split()[-1]
    mask = alpha.point(lambda a: 255 if a > 10 else 0)
    mask = mask.filter(ImageFilter.MaxFilter(DILATE_PX * 2 + 1))

    scene_arr = np.array(scene)
    mask_arr = np.array(mask) > 0
    scene_arr[mask_arr, 3] = 0
    cleaned = Image.fromarray(scene_arr, "RGBA")

    cleaned.alpha_composite(cutout)
    cleaned.save(ingredients_path)
    print(f"fixed {ingredients_path}")


def main() -> None:
    args = sys.argv[1:]
    slugs = ALL_SLUGS if args == ["--all"] else args
    if not slugs:
        raise SystemExit("usage: fix_bottle_ghost.py <slug>... | --all")
    for slug in slugs:
        fix_one(slug)


if __name__ == "__main__":
    main()
