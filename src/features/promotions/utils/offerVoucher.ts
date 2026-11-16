import type { DiscoveryOffer } from "../types/discovery";
import type { OfferContext, OfferIcon, OfferValue, PdpOffer } from "../types/offerVoucher";
import type { MessageKey, Translator } from "@/lib/i18n/messages";

/** Voucher tag per offer icon (`promo.tag.*` messages). */
const TAGS: Record<OfferIcon, MessageKey> = {
  bundle: "promo.tag.bundle",
  delivery: "promo.tag.delivery",
  card: "promo.tag.card",
  star: "promo.tag.star",
  tag: "promo.tag.tag",
  gift: "promo.tag.gift",
  bank: "promo.tag.bank",
  clock: "promo.tag.clock",
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

export function voucherSubline(offers: PdpOffer[], t: Translator): string {
  const labels = offers
    .slice(1)
    .map((offer) => offer.short?.trim())
    .filter((label): label is string => Boolean(label))
    .slice(0, 2);
  const more = Math.max(0, offers.length - 1 - labels.length);
  if (!labels.length && more === 0) return "";
  const [first = "", second = ""] = labels;
  if (labels.length === 2 && more > 0) return t("promo.plusTwoMore", { first, second, more });
  if (labels.length === 2) return t("promo.plusTwo", { first, second });
  if (labels.length === 1 && more > 0) return t("promo.plusOneMore", { first, more });
  if (labels.length === 1) return t("promo.plusOne", { first });
  return t("promo.plusMore", { more });
}

export function mapDiscoveryOffers(offers: DiscoveryOffer[], t: Translator): PdpOffer[] {
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
      ? { label: offer.details.ctaLabel || t("promo.buildSet"), href: offer.shopOfferPath }
      : undefined;
    return {
      id: offer.campaignCode,
      tag: t(TAGS[icon]),
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
              label: left > 0 ? t("promo.toGo", { amount: ctx.fmt(left) }) : t("promo.unlocked"),
            };
          }
        : undefined,
      action,
    };
  });
}
