# lp/5 creatives spec

Source: Swiss Arabian v2 / landing `lp/5` CSS (`v5-landing.css`, `v5-detail.css`, `v5-catalog.css`, `v5-chrome.css`, `v5-cart.css`).

Upload **2×** the CSS box so retina stays sharp. `object-fit: cover` = extra crop is OK; never send a different ratio than the slot. **JPG/WebP** photos, **PNG/WebP** bottles on cream, **MP4/H.264** reels. Max ~1.5 MB still / ~8 MB reel unless CDN compresses.

Text on photos: keep **copy out of the outer 8–10%** (hero left 40% is dark gradient + headline).

---

## Global / chrome

| Slot | Ratio | CSS box | Export (min) | Notes |
|---|---|---|---|---|
| Logo (header) | intrinsic | max-height **40px**, max-width **160px** | **480×160** PNG/SVG | Transparent. Dark footer uses same file + invert/filter. |
| Logo (footer on dark) | same | same | same | Cream/white version **or** one dark logo (site filters). |
| Mega-nav promo | **3:2** | max-width 420px | **1200×800** | Optional `cover`, focal point ~30% from top. |
| Mega-nav product tile | **4:5** | ~grid cell | **800×1000** | Same as PLP card. |

---

## Home (`/lp/5`)

| Slot | Count | Ratio | CSS | Export (min) | Format |
|---|---|---|---|---|---|
| **Hero** | **4** slides | Full-bleed cover | `min-height: min(80vh, 760px)`, `object-fit: cover`, position **center 30%** | Desktop **1920×1080** (16:9). Also **1080×1920** (9:16) if you want a dedicated mobile crop | JPG. Headline sits **left**; keep faces/bottles **right-center**. |
| Feature cards (Crafted / Returns / Bottles / Reviews) | **4** | Product still, `contain` | Decorative, ~120–240px wide in CSS | **800×800** PNG, bottle cutout | Not a banner; floats behind type. |
| **Shop by notes** | **8** | **1:1** circle | `clamp(96px, 14vw, 128px)` | **512×512** | Cropped circle; subject in centre. |
| **Product card** (best sellers, trending, related) | per SKU | **4:5** | `aspect-ratio 4/5`, padding ~20% cream | **1200×1500** | Bottle on cream/white. **2nd image** same ratio for hover swap. Optional **ingredients flat-lay** 4:5 for hover. |
| **Collections** (Perfumes, Incense, …) | **4** | Portrait tile | Grid row **~600px** tall, 4 columns, `cover`, origin **bottom**, scaled **1.38** | **1600×2000** (4:5) | Lifestyle or bottle; important bits in **lower 60%**. |
| **Community reel** | **5+** | **1 : 1.2** (5:6) | `aspect-ratio: 1/1.2`, rounded 16px, `cover`, position **center 18%** | **1080×1296** (or 1080×1350 Reels) | **MP4 9:16** is OK (will crop sides). Length **6–15s**, no audio required. |
| Community **product chip** | 1 per reel | **1:1** | **58×58** circle, `contain` | Use PDP packshot **800×800** | Mapped to SKU (not baked into video). |
| **Bundles / campaign** | 1–2 | Desktop full-bleed ~**16:9 to 21:9**; tablet **16:10**; mobile **535:690** (~**7:9**) | Desktop `min-height clamp(440px, 46vw, 620px)`; mobile `535/690` | Desktop **1920×900**. Mobile **1080×1400** (copy can be **in the photo** on mobile) | If type is in the image, do **two files** (desktop / mobile). |
| **Our story** | 1 | Cover, tall | `min-height clamp(460px, 72vh, 640px)`, `cover` | **1920×1200** | Dark overlay on top; centre is copy — keep subject **edges**, not dead centre. |

---

## Collection / PLP (`/collections/…`, `/products`)

| Slot | Ratio | CSS | Export (min) |
|---|---|---|---|
| Collection **hero** | Wide still, `cover` | Split: media `min-height 280–420px`, `max-height 480px`; mobile `260–320px`; position **center 42%** | **1600×900** (desktop). Mobile **1200×900** |
| Product grid | **4:5** | Same as home cards | **1200×1500** |

---

## PDP

| Slot | Ratio | CSS | Export (min) |
|---|---|---|---|
| Main packshot | Portrait in frame | Frame height `min(62svh, 500px)` desktop, `min(52svh, 420px)` mobile; **`object-fit: cover`**. Source often **1536×1024** canvas in mocks — **do not** rely on that; export **4:5** or **3:4** bottle on even cream | **1600×2000** (4:5) |
| Gallery thumbs | same crop | **52×52** | Same files as main; no extra asset |
| Hover / alt angle | **4:5** | Card + PDP thumbs | **1200×1500** |
| Ingredients / “how it’s built” **photo** (if used) | **4:5** | Hover overlay | **1200×1500** |
| Composition tabs (Story, Notes, …) | — | **Text**, not a hero image | Copy in CMS. No image spec. |

---

## Cart / checkout

| Slot | Ratio | CSS | Export |
|---|---|---|---|
| Cart line | **1:1** | **72×72** | Reuse packshot |
| Checkout line | **1:1** | **96px** wide | same |
| Upsell / “don’t miss this” | **4:5** | Product card | Same PLP card |

---

## Social / SEO (not lp/5 layout, still needed)

| Slot | Size |
|---|---|
| Open Graph / WhatsApp | **1200×630** (1.91:1) |
| Favicon | **32 / 180** PNG + SVG |

---

## Counts (home lp/5 as built)

- Hero: **4** photos  
- Feature: **4** PNGs  
- Notes: **8** circles  
- Collection tiles: **4**  
- Community: **5** videos (more if Instagram)  
- Bundles: **1 desktop + 1 mobile** recommended  
- Story: **1**  

Product photography: **one 4:5 packshot per SKU** (plus optional alt + ingredients).

---

## Naming (CMS)

`hero-home-01.jpg` … `hero-home-04.jpg`  
`home-note-woody.jpg`  
`home-collection-perfumes.jpg`  
`home-reel-01.mp4`  
`pdp-{sku}-packshot.jpg`  
`pdp-{sku}-alt.jpg`  
`pdp-{sku}-ingredients.jpg`  
`bundles-desktop.jpg` / `bundles-mobile.jpg`
