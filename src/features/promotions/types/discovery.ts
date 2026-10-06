export type DiscoveryOffer = {
  campaignId: string;
  campaignCode: string;
  mechanic: string;
  publicTitle: string;
  badge: string;
  shortMessage: string;
  benefitSummary: string;
  qualificationSummary: string;
  activationType: string;
  presentationState: string;
  shopOfferAvailable: boolean;
  shopOfferPath: string | null;
  detailsAvailable: boolean;
  marketCode: string;
  currencyCode: string | null;
  groups: Array<{ name: string; quantity: number }>;
  lines: string[];
  details: {
    whatYouGet: string;
    howToQualify: string;
    restrictions: string[];
    ctaLabel: string | null;
  };
};

export type DiscoveryChrome = {
  viewDetails: string;
  close: string;
  viewAll: string;
  whatYouGet: string;
  howToQualify: string;
  restrictions: string;
  loading: string;
  unavailable: string;
};

const ENGLISH_CHROME: DiscoveryChrome = {
  viewDetails: "View details",
  close: "Close",
  viewAll: "View all benefits",
  whatYouGet: "What you get",
  howToQualify: "How to qualify",
  restrictions: "Important restrictions",
  loading: "Loading.",
  unavailable: "This is not available in your market.",
};

export type PromotionDiscovery = {
  brandCode: string | null;
  marketCode: string | null;
  currencyCode: string | null;
  locale: string;
  entryLabel: string | null;
  offers: DiscoveryOffer[];
  primaryOffer: DiscoveryOffer | null;
  secondaryOffers: DiscoveryOffer[];
  unlockedBenefits: Array<{ campaignCode: string; message: string }>;
  nextBestAction: { campaignCode: string; message: string; path: string | null } | null;
  tiles: DiscoveryOffer[];
  chrome: DiscoveryChrome;
  productBadges: Array<{
    productId: string;
    campaignCode: string;
    badge: string;
    publicTitle: string;
  }>;
};

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function offer(value: unknown): DiscoveryOffer | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const row = value as Record<string, unknown>;
  const code = text(row.campaignCode);
  const title = text(row.publicTitle);
  if (!code || !title) return null;
  const details = row.details && typeof row.details === "object" && !Array.isArray(row.details)
    ? (row.details as Record<string, unknown>)
    : {};
  const groups = Array.isArray(row.groups)
    ? row.groups.flatMap((item) => {
        if (!item || typeof item !== "object") return [];
        const name = text((item as { name?: unknown }).name);
        if (!name) return [];
        const quantity = Number((item as { quantity?: unknown }).quantity);
        return [{ name, quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1 }];
      })
    : [];
  const lines = Array.isArray(row.lines)
    ? row.lines.map((item) => text(item)).filter(Boolean)
    : [];
  return {
    campaignId: text(row.campaignId),
    campaignCode: code,
    mechanic: text(row.mechanic),
    publicTitle: title,
    badge: text(row.badge),
    shortMessage: text(row.shortMessage),
    benefitSummary: text(row.benefitSummary),
    qualificationSummary: text(row.qualificationSummary),
    activationType: text(row.activationType),
    presentationState: text(row.presentationState),
    shopOfferAvailable: row.shopOfferAvailable === true,
    shopOfferPath: text(row.shopOfferPath) || null,
    detailsAvailable: row.detailsAvailable !== false,
    marketCode: text(row.marketCode),
    currencyCode: text(row.currencyCode) || null,
    groups,
    lines,
    details: {
      whatYouGet: text(details.whatYouGet),
      howToQualify: text(details.howToQualify),
      restrictions: Array.isArray(details.restrictions)
        ? details.restrictions.map((item) => text(item)).filter(Boolean)
        : [],
      ctaLabel: text(details.ctaLabel) || null,
    },
  };
}

export function emptyDiscovery(): PromotionDiscovery {
  return {
    brandCode: null,
    marketCode: null,
    currencyCode: null,
    locale: "en",
    entryLabel: null,
    offers: [],
    primaryOffer: null,
    secondaryOffers: [],
    unlockedBenefits: [],
    nextBestAction: null,
    tiles: [],
    chrome: ENGLISH_CHROME,
    productBadges: [],
  };
}

function chromeFrom(value: unknown): DiscoveryChrome {
  const row = value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
  return {
    viewDetails: text(row.viewDetails) || ENGLISH_CHROME.viewDetails,
    close: text(row.close) || ENGLISH_CHROME.close,
    viewAll: text(row.viewAll) || ENGLISH_CHROME.viewAll,
    whatYouGet: text(row.whatYouGet) || ENGLISH_CHROME.whatYouGet,
    howToQualify: text(row.howToQualify) || ENGLISH_CHROME.howToQualify,
    restrictions: text(row.restrictions) || ENGLISH_CHROME.restrictions,
    loading: text(row.loading) || ENGLISH_CHROME.loading,
    unavailable: text(row.unavailable) || ENGLISH_CHROME.unavailable,
  };
}

export function readPromotionDiscovery(raw: unknown): PromotionDiscovery {
  const data = raw && typeof raw === "object" && !Array.isArray(raw)
    ? (raw as Record<string, unknown>)
    : {};
  const offers = Array.isArray(data.offers) ? data.offers.flatMap((item) => {
    const parsed = offer(item);
    return parsed ? [parsed] : [];
  }) : [];
  const tiles = Array.isArray(data.tiles) ? data.tiles.flatMap((item) => {
    const parsed = offer(item);
    return parsed ? [parsed] : [];
  }) : [];
  const productBadges = Array.isArray(data.productBadges)
    ? data.productBadges.flatMap((item) => {
        if (!item || typeof item !== "object") return [];
        const row = item as Record<string, unknown>;
        const productId = text(row.productId);
        const badge = text(row.badge);
        if (!productId || !badge) return [];
        return [{
          productId,
          campaignCode: text(row.campaignCode),
          badge,
          publicTitle: text(row.publicTitle),
        }];
      })
    : [];
  return {
    brandCode: text(data.brandCode) || null,
    marketCode: text(data.marketCode) || null,
    currencyCode: text(data.currencyCode) || null,
    locale: text(data.locale) || "en",
    entryLabel: text(data.entryLabel) || null,
    offers,
    primaryOffer: offer(data.primaryOffer),
    secondaryOffers: Array.isArray(data.secondaryOffers)
      ? data.secondaryOffers.flatMap((item) => {
          const parsed = offer(item);
          return parsed ? [parsed] : [];
        })
      : offers.slice(1),
    unlockedBenefits: Array.isArray(data.unlockedBenefits)
      ? data.unlockedBenefits.flatMap((item) => {
          if (!item || typeof item !== "object") return [];
          const message = text((item as { message?: unknown }).message);
          if (!message) return [];
          return [{
            campaignCode: text((item as { campaignCode?: unknown }).campaignCode),
            message,
          }];
        })
      : [],
    nextBestAction: data.nextBestAction && typeof data.nextBestAction === "object"
      ? {
          campaignCode: text((data.nextBestAction as { campaignCode?: unknown }).campaignCode),
          message: text((data.nextBestAction as { message?: unknown }).message),
          path: text((data.nextBestAction as { path?: unknown }).path) || null,
        }
      : null,
    tiles,
    chrome: chromeFrom(data.chrome),
    productBadges,
  };
}

export function badgeForProduct(
  discovery: PromotionDiscovery | null | undefined,
  productId: string | null | undefined,
): { badge: string; title: string } | null {
  if (!discovery || !productId) return null;
  const row = discovery.productBadges.find((item) => item.productId === productId);
  if (!row) return null;
  return { badge: row.badge, title: row.publicTitle };
}
