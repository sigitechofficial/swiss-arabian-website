/**
 * The CMS homepage sections Sapil's home draws, typed in one place and parsed
 * defensively: a missing or malformed section becomes `null` (rendered as nothing).
 *
 * Shapes follow the backend contract on `feat/sapil-cms`
 * (`src/modules/content/section-registry/section-config.schemas.ts` + the storefront
 * resolver in `storefront-content.service.ts`): HERO_GALLERY rooms carry their
 * `collection` and `product` card; MOOD_PICKER moods carry `products`; scroll-story
 * COLLECTION_SHOWCASE tiles carry a `summary`; product cards may carry `tileColor`.
 */
import type { ProductSummary } from "@/features/catalog/types/product";
import type { CmsLink, CmsProductCard, CmsSection } from "@/features/cms/types/cmsHome.types";
import { mapCmsProduct } from "@/features/cms/utils/mapCmsProduct";
import { resolveCmsLink, type CmsLinkContext } from "@/features/cms/utils/resolveCmsLink";
import { SAPIL_PASTELS, type SapilPastel } from "../../ui/shared";
import { parseMoney } from "@/lib/format/money";

/* ——— primitives ——— */

type Rec = Record<string, unknown>;
const rec = (v: unknown): Rec | null => (v && typeof v === "object" && !Array.isArray(v) ? (v as Rec) : null);
const str = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v.trim() : null);
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const link = (v: unknown): CmsLink | null => {
  const r = rec(v);
  return r && typeof r.type === "string" ? (r as CmsLink) : null;
};

export function pastel(v: unknown): SapilPastel | null {
  return typeof v === "string" && (SAPIL_PASTELS as readonly string[]).includes(v) ? (v as SapilPastel) : null;
}

/** Text split into plain and serif (emphasised) parts. */
export type TextPart = { text: string; emphasis: boolean };

/** Resolver's `headingParts`, else split `text` around `emphasis` (same rule as the backend). */
export function textParts(text: string | null, emphasis: string | null, parts?: unknown): TextPart[] {
  const given = arr(parts)
    .map(rec)
    .filter((p): p is Rec => p !== null && typeof p.text === "string")
    .map((p) => ({ text: p.text as string, emphasis: p.emphasis === true }));
  if (given.length) return given;
  if (!text) return [];
  const i = emphasis ? text.indexOf(emphasis) : -1;
  if (!emphasis || i < 0) return [{ text, emphasis: false }];
  return [
    { text: text.slice(0, i), emphasis: false },
    { text: emphasis, emphasis: true },
    { text: text.slice(i + emphasis.length), emphasis: false },
  ].filter((p) => p.text.length > 0);
}

/**
 * A product card from a section, with its tile colour (API `tileColor`) and the
 * market's was-price (`priceSummary.compareAtPrice`, only when above the price).
 */
export type HomeProduct = { product: ProductSummary; tileColor: SapilPastel | null; wasPrice: number | null };

export function homeProduct(raw: unknown): HomeProduct | null {
  const r = rec(raw);
  if (!r) return null;
  const product = mapCmsProduct(r as unknown as CmsProductCard);
  if (!product) return null;
  const was = parseMoney(rec(r.priceSummary)?.compareAtPrice);
  const tileColor = pastel(r.tileColor);
  const wasPrice = was != null && product.price != null && was > product.price ? was : null;
  return {
    // The shared SapilProductCard reads the tile and was-price from the product itself.
    product: { ...product, tileColor: tileColor ?? product.tileColor ?? null, compareAtPrice: wasPrice ?? product.compareAtPrice ?? null },
    tileColor,
    wasPrice,
  };
}

export function homeProducts(raw: unknown): HomeProduct[] {
  return arr(raw)
    .map(homeProduct)
    .filter((p): p is HomeProduct => p !== null);
}

export type Cta = { label: string; href: string };

/**
 * A home section's editable head: `heading` is the small label above, `title` the big
 * heading (its `titleEmphasis` part set in the serif accent), `subtitle` the line under it.
 * Empty fields keep the built-in copy (see `SectionTitle` / `sectionTitleProps`).
 */
export type SectionCopy = { heading: string | null; title: TextPart[]; subtitle: string | null };

export function sectionCopy(data: Rec, keys = { heading: "heading", title: "title", emphasis: "titleEmphasis", subtitle: "subtitle" }): SectionCopy {
  return {
    heading: str(data[keys.heading]),
    title: textParts(str(data[keys.title]), str(data[keys.emphasis])),
    subtitle: str(data[keys.subtitle]),
  };
}

/** The "Under AED 99" price-edit shelf's head, from the first new-arrivals rail. */
export type PriceEditCopy = { eyebrow: string | null; title: TextPart[] };

export function priceEditCopy(data: Rec): PriceEditCopy {
  return { eyebrow: str(data.priceEditEyebrow), title: textParts(str(data.priceEditTitle), str(data.priceEditTitleEmphasis)) };
}

function cta(label: unknown, l: unknown, ctx?: CmsLinkContext): Cta | null {
  const text = str(label);
  const href = resolveCmsLink(link(l), ctx);
  return text && href ? { label: text, href } : null;
}

/* ——— sections ——— */

export type HeroRoom = {
  id: string;
  number: string;
  title: TextPart[];
  wall: SapilPastel;
  collection: { id: string; slug: string | null; name: string };
  piece: HomeProduct;
  ctaLabel: string | null;
};

export type HeroGallery = {
  kind: "HERO_GALLERY";
  eyebrow: string | null;
  heading: TextPart[];
  lead: string | null;
  primary: Cta | null;
  secondary: Cta | null;
  rooms: HeroRoom[];
  initialRoom: number;
  autoAdvance: boolean;
};

export function parseHeroGallery(data: Rec, ctx?: CmsLinkContext): HeroGallery | null {
  const rooms = arr(data.rooms)
    .map(rec)
    .flatMap((r): HeroRoom[] => {
      if (!r) return [];
      const collection = rec(r.collection);
      const piece = homeProduct(r.product);
      const name = str(collection?.name);
      if (!collection || !name || !piece) return [];
      return [
        {
          id: str(r.id) ?? piece.product.id,
          number: str(r.number) ?? "",
          title: textParts(str(r.title), str(r.titleEmphasis), r.titleParts),
          wall: pastel(r.wallColor) ?? "sand",
          collection: { id: String(collection.id ?? ""), slug: str(collection.slug), name },
          piece,
          ctaLabel: str(r.ctaLabel),
        },
      ];
    });
  const heading = textParts(str(data.heading), str(data.headingEmphasis), data.headingParts);
  if (!rooms.length || !heading.length) return null;
  const initial = Number(data.initialRoomIndex ?? 0);
  return {
    kind: "HERO_GALLERY",
    eyebrow: str(data.eyebrow),
    heading,
    lead: str(data.lead),
    primary: cta(data.ctaLabel, data.link, ctx),
    secondary: cta(data.secondaryCtaLabel, data.secondaryLink, ctx),
    rooms,
    initialRoom: Number.isInteger(initial) ? Math.min(Math.max(initial, 0), rooms.length - 1) : 0,
    autoAdvance: data.autoAdvance !== false,
  };
}

export type CampaignSlide = {
  id: string;
  image: string;
  mobileImage: string | null;
  alt: string;
  objectPosition: string | null;
  eyebrow: string | null;
  heading: string | null;
  text: string | null;
  primary: Cta | null;
  secondary: Cta | null;
};

export type HeroCampaign = { kind: "HERO_CAMPAIGN"; slides: CampaignSlide[]; autoplay: boolean; intervalMs: number };

/** HERO_SLIDER (several slides) or HERO_BANNER (one) → the v9 campaign slideshow. */
export function parseHeroCampaign(type: string, data: Rec, ctx?: CmsLinkContext): HeroCampaign | null {
  const raw = type === "HERO_BANNER" ? [data] : arr(data.slides).map(rec).filter((s): s is Rec => s !== null);
  const slides = raw.flatMap((s, i): CampaignSlide[] => {
    const image = str(s.desktopImage);
    if (!image) return [];
    const heading = str(s.heading) ?? (type === "HERO_SLIDER" ? str(data.heading) : null);
    return [
      {
        id: str(s.id) ?? String(i),
        image,
        mobileImage: str(s.mobileImage),
        alt: str(s.altText) ?? heading ?? "",
        objectPosition: str(s.objectPosition),
        eyebrow: str(s.eyebrow) ?? str(data.eyebrow),
        heading,
        text: str(s.description) ?? str(s.subheading) ?? str(data.subheading),
        primary: cta(s.ctaLabel, s.link, ctx) ?? cta(data.ctaLabel, data.link, ctx),
        secondary: cta(s.secondaryCtaLabel, s.secondaryLink, ctx) ?? cta(data.secondaryCtaLabel, data.secondaryLink, ctx),
      },
    ];
  });
  if (!slides.length) return null;
  const ms = Number(data.autoplayIntervalMs);
  return {
    kind: "HERO_CAMPAIGN",
    slides,
    autoplay: data.autoplay !== false,
    intervalMs: Number.isFinite(ms) && ms >= 2000 ? Math.min(ms, 30000) : 6500,
  };
}

export type Bundle = {
  id: string;
  eyebrow: string | null;
  heading: string | null;
  description: string | null;
  image: string | null;
  products: HomeProduct[];
  /** sum of the bottles' prices (the saving, if any, is applied in the bag by promotions) */
  total: number | null;
  currency: string | null;
  primary: Cta | null;
  secondary: Cta | null;
  /** the "Shop by bundle" row head (read from the row's first bundle) */
  row: SectionCopy;
};

export function parseBundle(id: string, data: Rec, ctx?: CmsLinkContext): Bundle | null {
  const products = homeProducts(data.products);
  if (!products.length && !str(data.heading)) return null;
  const prices = products.map((p) => p.product.price);
  const total = prices.length && prices.every((p) => p != null) ? (prices as number[]).reduce((a, b) => a + b, 0) : null;
  return {
    id,
    eyebrow: str(data.eyebrow),
    heading: str(data.heading),
    description: str(data.description),
    image: str(data.desktopImage),
    products,
    total,
    currency: products[0]?.product.currency ?? null,
    primary: cta(data.primaryCtaLabel, data.primaryLink, ctx),
    secondary: cta(data.secondaryCtaLabel, data.secondaryLink, ctx),
    row: sectionCopy(data, { heading: "rowEyebrow", title: "rowTitle", emphasis: "rowTitleEmphasis", subtitle: "rowSubtitle" }),
  };
}

export type ProductRailSection = SectionCopy & {
  products: HomeProduct[];
  viewAll: Cta | null;
  viewAllHref: string | null;
  priceEdit: PriceEditCopy;
};

export function parseProductRail(data: Rec, ctx?: CmsLinkContext): ProductRailSection | null {
  const products = homeProducts(data.products);
  if (!products.length) return null;
  const href = resolveCmsLink(link(data.link), ctx);
  return {
    ...sectionCopy(data),
    products,
    viewAll: href && str(data.viewAllLabel) ? { label: str(data.viewAllLabel)!, href } : null,
    viewAllHref: href,
    priceEdit: priceEditCopy(data),
  };
}

export type CollectionCard = {
  id: string;
  title: string;
  text: string | null;
  href: string;
  color: SapilPastel;
  count: number | null;
  fromPrice: number | null;
  currency: string | null;
  images: Array<{ url: string; name: string }>;
};

export function parseCollectionShowcase(
  data: Rec,
  ctx?: CmsLinkContext,
): { heading: string | null; title: TextPart[]; text: string | null; cards: CollectionCard[] } | null {
  const cards = arr(data.tiles)
    .map(rec)
    .flatMap((t, i): CollectionCard[] => {
      const title = str(t?.title);
      if (!t || !title) return [];
      const summary = rec(t.summary);
      const images = arr(summary?.images)
        .map(rec)
        .flatMap((im) => (im && str(im.url) ? [{ url: str(im.url)!, name: str(im.name) ?? "", tile: pastel(im.tileColor) }] : []));
      const href = str(t.href) ?? resolveCmsLink(link(t.link), ctx) ?? "/collections";
      const count = summary ? parseMoney(summary.productCount) : null;
      return [
        {
          id: str(t.id) ?? String(i),
          title,
          text: str(t.supportingText),
          href,
          color: images[0]?.tile ?? SAPIL_PASTELS[i % SAPIL_PASTELS.length],
          count,
          fromPrice: summary ? parseMoney(summary.minPrice) : null,
          currency: str(summary?.currencyCode),
          images: images.slice(0, 3).map(({ url, name }) => ({ url, name })),
        },
      ];
    });
  if (!cards.length) return null;
  const { heading, title, subtitle } = sectionCopy(data);
  return { heading, title, text: subtitle, cards };
}

export type Mood = {
  id: string;
  name: string;
  color: SapilPastel;
  line: string;
  notes: string[];
  products: HomeProduct[];
};

export function parseMoodPicker(data: Rec): { eyebrow: string | null; heading: string | null; spinLabel: string | null; moods: Mood[] } | null {
  const moods = arr(data.moods)
    .map(rec)
    .flatMap((m, i): Mood[] => {
      const name = str(m?.name);
      if (!m || !name) return [];
      const products = homeProducts(m.products);
      if (!products.length) return [];
      return [
        {
          id: str(m.id) ?? String(i),
          name,
          color: pastel(m.color) ?? SAPIL_PASTELS[i % SAPIL_PASTELS.length],
          line: str(m.line) ?? "",
          notes: arr(m.notes).map(str).filter((n): n is string => n !== null).slice(0, 3),
          products: products.slice(0, 4),
        },
      ];
    });
  if (moods.length < 2) return null;
  return { eyebrow: str(data.eyebrow), heading: str(data.heading), spinLabel: str(data.spinLabel), moods };
}

export type BrandStory = {
  eyebrow: string | null;
  heading: string;
  paragraphs: string[];
  image: string | null;
  alt: string;
  stats: Array<{ id: string; value: string; label: string }>;
  cta: Cta | null;
};

export function parseBrandStory(data: Rec, ctx?: CmsLinkContext): BrandStory | null {
  const heading = str(data.heading);
  const paragraphs = arr(data.paragraphs).map(str).filter((p): p is string => p !== null);
  if (!heading || !paragraphs.length) return null;
  return {
    eyebrow: str(data.eyebrow),
    heading,
    paragraphs,
    image: str(data.image),
    alt: str(data.altText) ?? "",
    stats: arr(data.statistics)
      .map(rec)
      .flatMap((s, i) => (s && str(s.value) && str(s.label) ? [{ id: str(s.id) ?? String(i), value: str(s.value)!, label: str(s.label)! }] : []))
      .slice(0, 3),
    cta: cta(data.ctaLabel, data.link, ctx),
  };
}

export type Newsletter = {
  eyebrow: string | null;
  heading: string;
  description: string | null;
  placeholder: string | null;
  buttonLabel: string | null;
  successMessage: string | null;
};

export function parseNewsletter(data: Rec): Newsletter | null {
  const heading = str(data.heading);
  if (!heading) return null;
  return {
    eyebrow: str(data.eyebrow),
    heading,
    description: str(data.description),
    placeholder: str(data.placeholder),
    buttonLabel: str(data.buttonLabel),
    successMessage: str(data.successMessage),
  };
}

/* ——— the page plan ——— */

/** First-section types that become the hero (one of v9's four layouts). */
export const HERO_TYPES = new Set(["HERO_GALLERY", "SHOPABLE_VIDEO_SHOWCASE", "HERO_SLIDER", "HERO_BANNER", "BUNDLE_PROMOTION_SHOWCASE"]);

export type HomeBlock =
  | { kind: "heroGallery"; id: string; hero: HeroGallery }
  | ({ kind: "heroVideo"; id: string } & SectionCopy)
  | { kind: "heroCampaign"; id: string; hero: HeroCampaign }
  | { kind: "heroPromo"; id: string; bundle: Bundle }
  | { kind: "newArrivals"; id: string; rail: ProductRailSection }
  | { kind: "priceEdit"; id: string; copy: PriceEditCopy }
  | { kind: "collections"; id: string; showcase: NonNullable<ReturnType<typeof parseCollectionShowcase>> }
  | { kind: "topSellers"; id: string; rail: ProductRailSection }
  | { kind: "mood"; id: string; picker: NonNullable<ReturnType<typeof parseMoodPicker>> }
  | ({ kind: "notes"; id: string } & SectionCopy)
  | { kind: "bundles"; id: string; bundles: Bundle[] }
  | ({ kind: "reels"; id: string } & SectionCopy)
  | { kind: "about"; id: string; story: BrandStory }
  | { kind: "newsletter"; id: string; newsletter: Newsletter };

/**
 * The homepage, in CMS order. The first section is the hero when its type has a
 * hero layout. Bundle sections next to each other share one "bundles" row. The
 * price-edit shelf (market data, not a CMS section) follows the first new-arrivals rail.
 * Unknown or empty sections are skipped.
 */
export function planHome(sections: CmsSection[], ctx?: CmsLinkContext): HomeBlock[] {
  const ordered = [...sections].sort((a, b) => a.position - b.position);
  const blocks: HomeBlock[] = [];
  let priceEditPlaced = false;
  ordered.forEach((section, index) => {
    const data = rec(section.data) ?? {};
    const id = section.id;
    const asHero = index === 0 && HERO_TYPES.has(section.type);
    try {
      switch (section.type) {
        case "HERO_GALLERY": {
          const hero = parseHeroGallery(data, ctx);
          if (hero) blocks.push({ kind: "heroGallery", id, hero });
          return;
        }
        case "HERO_SLIDER":
        case "HERO_BANNER": {
          const hero = parseHeroCampaign(section.type, data, ctx);
          if (hero) blocks.push({ kind: "heroCampaign", id, hero });
          return;
        }
        case "SHOPABLE_VIDEO_SHOWCASE":
          blocks.push({ kind: asHero ? "heroVideo" : "reels", id, ...sectionCopy(data) });
          return;
        case "BUNDLE_PROMOTION_SHOWCASE": {
          const bundle = parseBundle(id, data, ctx);
          if (!bundle) return;
          if (asHero) {
            blocks.push({ kind: "heroPromo", id, bundle });
            return;
          }
          const last = blocks.at(-1);
          if (last?.kind === "bundles") last.bundles.push(bundle);
          else blocks.push({ kind: "bundles", id, bundles: [bundle] });
          return;
        }
        case "PRODUCT_CAROUSEL":
        case "FEATURED_COLLECTION": {
          const rail = parseProductRail(data, ctx);
          if (!rail) return;
          blocks.push({ kind: "newArrivals", id, rail });
          if (!priceEditPlaced) {
            priceEditPlaced = true;
            blocks.push({ kind: "priceEdit", id: `${id}-price-edit`, copy: rail.priceEdit });
          }
          return;
        }
        case "TRENDING_PRODUCTS": {
          const rail = parseProductRail(data, ctx);
          if (rail) blocks.push({ kind: "topSellers", id, rail });
          return;
        }
        case "COLLECTION_SHOWCASE": {
          const showcase = parseCollectionShowcase(data, ctx);
          if (showcase) blocks.push({ kind: "collections", id, showcase });
          return;
        }
        case "MOOD_PICKER": {
          const picker = parseMoodPicker(data);
          if (picker) blocks.push({ kind: "mood", id, picker });
          return;
        }
        case "FRAGRANCE_NOTES_SHOWCASE":
          blocks.push({ kind: "notes", id, ...sectionCopy(data) });
          return;
        case "BRAND_STORY": {
          const story = parseBrandStory(data, ctx);
          if (story) blocks.push({ kind: "about", id, story });
          return;
        }
        case "NEWSLETTER_SIGNUP": {
          const newsletter = parseNewsletter(data);
          if (newsletter) blocks.push({ kind: "newsletter", id, newsletter });
          return;
        }
        default:
          return;
      }
    } catch {
      // A malformed section is skipped, never a crash.
    }
  });
  return blocks;
}
