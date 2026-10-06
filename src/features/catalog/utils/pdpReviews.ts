import type {
  StorefrontPdpReviews,
  StorefrontPublicReview,
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

function parseBreakdown(raw: unknown): StorefrontReviewSummary["ratingBreakdown"] {
  const row = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  return {
    "1": Math.max(0, Math.trunc(asNumber(row["1"]))),
    "2": Math.max(0, Math.trunc(asNumber(row["2"]))),
    "3": Math.max(0, Math.trunc(asNumber(row["3"]))),
    "4": Math.max(0, Math.trunc(asNumber(row["4"]))),
    "5": Math.max(0, Math.trunc(asNumber(row["5"]))),
  };
}

function parseItem(raw: unknown): StorefrontPublicReview | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const reviewId = asText(row.reviewId);
  const rating = Math.trunc(asNumber(row.rating));
  if (!reviewId || rating < 1 || rating > 5) return null;
  const variantRaw = row.variant;
  let variant: StorefrontPublicReview["variant"] = null;
  if (variantRaw && typeof variantRaw === "object") {
    const v = variantRaw as Record<string, unknown>;
    const variantId = asText(v.variantId);
    if (variantId) {
      variant = {
        variantId,
        variantName: asText(v.variantName),
        sku: asText(v.sku),
      };
    }
  }
  return {
    reviewId,
    rating,
    title: asText(row.title),
    body: asText(row.body),
    displayName: asText(row.displayName),
    verifiedPurchase: row.verifiedPurchase === true,
    createdAt: asText(row.createdAt) ?? "",
    helpfulCount: Math.max(0, Math.trunc(asNumber(row.helpfulCount))),
    variant,
  };
}

export function parsePdpReviews(raw: unknown): StorefrontPdpReviews | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const summaryRaw = row.summary;
  if (!summaryRaw || typeof summaryRaw !== "object") return null;
  const summaryRow = summaryRaw as Record<string, unknown>;
  const productId = asText(summaryRow.productId);
  if (!productId) return null;
  const items = Array.isArray(row.items)
    ? row.items.map(parseItem).filter((item): item is StorefrontPublicReview => Boolean(item))
    : [];
  return {
    summary: {
      productId,
      averageRating: asNumber(summaryRow.averageRating),
      reviewCount: Math.max(0, Math.trunc(asNumber(summaryRow.reviewCount))),
      ratingBreakdown: parseBreakdown(summaryRow.ratingBreakdown),
      verifiedPurchaseCount: Math.max(0, Math.trunc(asNumber(summaryRow.verifiedPurchaseCount))),
    },
    items,
    total: Math.max(0, Math.trunc(asNumber(row.total, items.length))),
    limit: Math.max(0, Math.trunc(asNumber(row.limit, items.length))),
    offset: Math.max(0, Math.trunc(asNumber(row.offset))),
  };
}

export function reviewStarsLabel(rating: number): string {
  const filled = Math.min(5, Math.max(0, Math.round(rating)));
  return "★".repeat(filled) + "☆".repeat(5 - filled);
}
