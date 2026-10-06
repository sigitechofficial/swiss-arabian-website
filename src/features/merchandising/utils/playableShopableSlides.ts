import type { ShopableVideoSlide, ShopableVideoView } from "../types/merch";

function isHttpsVideoUrl(url: string | null | undefined): boolean {
  const trimmed = url?.trim() ?? "";
  return /^https:\/\//i.test(trimmed);
}

/** Slides the Watch & Shop carousel may render — skip empty / non-https video. */
export function playableShopableSlides(
  data: ShopableVideoView | null | undefined,
): ShopableVideoSlide[] {
  if (!data?.available || !data.slides.length) return [];

  return data.slides
    .filter((slide) => isHttpsVideoUrl(slide.video?.url))
    .slice()
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}

export function parseShopablePrice(
  slide: Pick<ShopableVideoSlide, "priceSummary">,
): { price: number | null; currency: string } {
  const summary = slide.priceSummary;
  const currency = summary?.currencyCode?.trim() || "AED";
  if (!summary || summary.hasValidPrice === false) {
    return { price: null, currency };
  }
  const n = Number(String(summary.price ?? "").trim());
  return { price: Number.isFinite(n) ? n : null, currency };
}
