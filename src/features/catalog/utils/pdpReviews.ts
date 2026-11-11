import type {
  ReviewSort,
  StorefrontPdpReviews,
  StorefrontPublicReview,
  StorefrontReviewDisplay,
  StorefrontReviewPage,
  StorefrontReviewSummary,
} from "../types/pdpReviews";

function asText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function asNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const n = Number(value.trim());
    return Number.isFinite(n) ? n : fallback;
  }
  return fallback;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

const SORTS: ReviewSort[] = ["useful", "newest", "rating_high", "rating_low"];

export const DEFAULT_REVIEW_DISPLAY: StorefrontReviewDisplay = {
  marketOnly: true,
  showVerifiedBadge: true,
  showReplies: true,
  minReviewsToShowStars: 1,
};

function parseBreakdown(raw: unknown): StorefrontReviewSummary["ratingBreakdown"] {
  const row = asRecord(raw);
  return {
    "1": Math.max(0, Math.trunc(asNumber(row["1"]))),
    "2": Math.max(0, Math.trunc(asNumber(row["2"]))),
    "3": Math.max(0, Math.trunc(asNumber(row["3"]))),
    "4": Math.max(0, Math.trunc(asNumber(row["4"]))),
    "5": Math.max(0, Math.trunc(asNumber(row["5"]))),
  };
}

export function parseReviewItem(raw: unknown): StorefrontPublicReview | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const reviewId = asText(row.reviewId);
  const rating = Math.trunc(asNumber(row.rating));
  if (!reviewId || rating < 1 || rating > 5) return null;
  const v = asRecord(row.variant);
  const variantId = asText(v.variantId);
  const reply = asRecord(row.reply);
  const replyText = asText(reply.text);
  return {
    reviewId,
    rating,
    title: asText(row.title),
    body: asText(row.body),
    displayName: asText(row.displayName),
    verifiedPurchase: row.verifiedPurchase === true,
    createdAt: asText(row.createdAt) ?? "",
    helpfulCount: Math.max(0, Math.trunc(asNumber(row.helpfulCount))),
    reply: replyText ? { text: replyText, repliedAt: asText(reply.repliedAt) } : null,
    photos: Array.isArray(row.photos)
      ? row.photos
          .map((p) => asRecord(p))
          .filter((p) => asText(p.url))
          .map((p) => ({ id: asText(p.id) ?? asText(p.url)!, url: asText(p.url)!, alt: asText(p.alt) }))
      : [],
    variant: variantId
      ? { variantId, variantName: asText(v.variantName), sku: asText(v.sku) }
      : null,
  };
}

function parseItems(raw: unknown): StorefrontPublicReview[] {
  return Array.isArray(raw)
    ? raw.map(parseReviewItem).filter((item): item is StorefrontPublicReview => Boolean(item))
    : [];
}

export function parseReviewPage(raw: unknown): StorefrontReviewPage {
  const row = asRecord(raw);
  const items = parseItems(row.items);
  return {
    items,
    total: Math.max(0, Math.trunc(asNumber(row.total, items.length))),
    limit: Math.max(0, Math.trunc(asNumber(row.limit, items.length))),
    offset: Math.max(0, Math.trunc(asNumber(row.offset))),
  };
}

export function parsePdpReviews(raw: unknown): StorefrontPdpReviews | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const summaryRow = asRecord(row.summary);
  const productId = asText(summaryRow.productId);
  if (!productId) return null;
  const page = parseReviewPage(row);
  const display = asRecord(row.display);
  const sort = asText(row.sort) as ReviewSort | null;
  return {
    summary: {
      productId,
      averageRating: asNumber(summaryRow.averageRating),
      reviewCount: Math.max(0, Math.trunc(asNumber(summaryRow.reviewCount))),
      ratingBreakdown: parseBreakdown(summaryRow.ratingBreakdown),
      verifiedPurchaseCount: Math.max(0, Math.trunc(asNumber(summaryRow.verifiedPurchaseCount))),
    },
    ...page,
    sort: sort && SORTS.includes(sort) ? sort : "useful",
    display: {
      marketOnly: display.marketOnly !== false,
      showVerifiedBadge: display.showVerifiedBadge !== false,
      showReplies: display.showReplies !== false,
      minReviewsToShowStars: Math.max(1, Math.trunc(asNumber(display.minReviewsToShowStars, 1))),
    },
  };
}

export function reviewStarsLabel(rating: number): string {
  const filled = Math.min(5, Math.max(0, Math.round(rating)));
  return "★".repeat(filled) + "☆".repeat(5 - filled);
}

/** "12 Oct 2026" in the shopper's language. */
export function reviewDate(iso: string, locale = "en-GB"): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" });
}
