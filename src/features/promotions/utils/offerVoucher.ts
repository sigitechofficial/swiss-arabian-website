import type { DiscoveryOffer } from "../types/discovery";
import type { OfferContext, OfferIcon, OfferValue, PdpOffer } from "../types/offerVoucher";

const TAGS: Record<OfferIcon, { en: string; ar: string }> = {
  bundle: { en: "Bundle", ar: "باقة" },
  delivery: { en: "Delivery", ar: "التوصيل" },
  card: { en: "Prepaid", ar: "الدفع المسبق" },
  star: { en: "Rewards", ar: "نقاط" },
  tag: { en: "Offer", ar: "عرض" },
  gift: { en: "Gift", ar: "هدية" },
  bank: { en: "Bank", ar: "البنك" },
  clock: { en: "Pay later", ar: "ادفع لاحقاً" },
};

function words(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06ff%]+/gi, " ")
    .split(/\s+/)
    .filter((word) => word.length > 1);
}

export function sameOfferCopy(left: string, right: string) {
  const a = left.trim();
  const b = right.trim();
  if (!a || !b) return false;
  if (a.toLowerCase() === b.toLowerCase()) return true;
  const leftWords = words(a);
  const rightWords = new Set(words(b));
  if (!leftWords.length || rightWords.size === 0) return false;
  const shared = leftWords.filter((word) => rightWords.has(word)).length;
  return shared / Math.min(leftWords.length, rightWords.size) >= 0.66;
}

export function offerIcon(offer: DiscoveryOffer): OfferIcon {
  const blob = `${offer.mechanic} ${offer.badge} ${offer.publicTitle}`.toLowerCase();
  if (blob.includes("bank")) return "bank";
  if (blob.includes("point") || blob.includes("reward")) return "star";
  if (blob.includes("prepaid") || /\bcard\b/.test(blob)) return "card";
  if (blob.includes("pay later") || blob.includes("instal")) return "clock";
  if (offer.mechanic === "GWP" || blob.includes("gift")) return "gift";
  if (
    offer.mechanic === "FREE_SHIPPING" ||
    offer.mechanic === "SHIPPING_DISCOUNT" ||
    blob.includes("delivery")
  ) {
    return "delivery";
  }
  if (offer.mechanic === "SET_BUNDLE" || offer.mechanic === "BUNDLE" || blob.includes("bundle")) return "bundle";
  if (offer.mechanic === "TIERED_SPEND") return "clock";
  return "tag";
}

function spendGoal(offer: DiscoveryOffer): number | null {
  const blob = `${offer.shortMessage} ${offer.details.howToQualify} ${offer.qualificationSummary}`;
  const match = blob.match(/AED\s*([\d,]+(?:\.\d+)?)/i);
  if (!match) return null;
  const amount = Number(match[1].replace(/,/g, ""));
  return Number.isFinite(amount) && amount > 0 ? amount : null;
}

export function resolveOfferValue(value: OfferValue | undefined, ctx: OfferContext): string {
  if (!value) return "";
  return (typeof value === "function" ? value(ctx) : value).trim();
}

export function bundlePercent(offers: PdpOffer[]): string | null {
  const source = offers
    .filter((offer) => offer.icon === "bundle")
    .map((offer) => `${offer.headline ?? ""} ${offer.short ?? ""} ${typeof offer.title === "string" ? offer.title : ""}`)
    .join(" ");
  const match = source.match(/(\d{1,3})\s*%/);
  return match ? match[1] : null;
}

export function voucherSubline(offers: PdpOffer[], arabic: boolean): string {
  const labels = offers
    .slice(1)
    .map((offer) => offer.short?.trim())
    .filter((label): label is string => Boolean(label))
    .slice(0, 2);
  const more = Math.max(0, offers.length - 1 - labels.length);
  if (!labels.length && more === 0) return "";
  if (arabic) {
    const listed = labels.join("، ");
    if (listed && more > 0) return `بالإضافة إلى ${listed} و${more} عروض أخرى.`;
    if (more > 0) return `${more} عروض أخرى.`;
    return `بالإضافة إلى ${listed}.`;
  }
  if (labels.length === 2 && more > 0) return `Plus ${labels[0]}, ${labels[1]} and ${more} more.`;
  if (labels.length === 2) return `Plus ${labels[0]} and ${labels[1]}.`;
  if (labels.length === 1 && more > 0) return `Plus ${labels[0]} and ${more} more.`;
  if (labels.length === 1) return `Plus ${labels[0]}.`;
  return `Plus ${more} more.`;
}

export function mapDiscoveryOffers(offers: DiscoveryOffer[], arabic: boolean): PdpOffer[] {
  return offers.map((offer, index) => {
    const icon = offerIcon(offer);
    const badge = offer.badge.trim();
    const title = badge || offer.publicTitle.trim();
    const headline = offer.publicTitle.trim() && !sameOfferCopy(offer.publicTitle, title) ? offer.publicTitle.trim() : title;
    const detail = [offer.shortMessage, offer.details.whatYouGet || offer.benefitSummary, offer.details.howToQualify || offer.qualificationSummary]
      .map((line) => line.trim())
      .find((line) => line && !sameOfferCopy(line, title) && !sameOfferCopy(line, headline));
    const goal = spendGoal(offer);
    const action = offer.shopOfferAvailable && offer.shopOfferPath
      ? { label: offer.details.ctaLabel || (arabic ? "اختَر القطع" : "Build a set"), href: offer.shopOfferPath }
      : undefined;
    return {
      id: offer.campaignCode,
      tag: arabic ? TAGS[icon].ar : TAGS[icon].en,
      icon,
      featured: index === 0,
      short: badge || undefined,
      headline,
      title,
      text: detail || undefined,
      progress: goal
        ? (ctx) => {
            const value = Math.min(goal, Math.max(0, ctx.subtotal));
            const left = Math.max(0, goal - ctx.subtotal);
            return {
              value,
              max: goal,
              label: left > 0 ? `${ctx.fmt(left)} to go` : arabic ? "تم فتح العرض" : "Offer unlocked",
            };
          }
        : undefined,
      action,
    };
  });
}
