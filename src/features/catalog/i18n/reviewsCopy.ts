"use client";

import { useMemo } from "react";
import { brandDisplayName } from "@/lib/brand";
import { useShopLocale, useShopTranslator } from "@/lib/i18n/ShopLocaleProvider";
import type { ShopLocale } from "@/lib/i18n/locales";
import type { MessageKey, Translator } from "@/lib/i18n/messages";

/**
 * Wording of the reviews section, the write-a-review panel and the review link
 * page from the email. The text lives in `src/messages/<locale>.json` under
 * `reviews.*` (a new language only needs its message file); this keeps the
 * shape the views use (plain strings and small formatters).
 */
function reviewsWording(t: Translator, brand: string) {
  const r = (key: string, values?: Record<string, string | number>) =>
    t(`reviews.${key}` as MessageKey, values);
  return {
    eyebrow: r("eyebrow"),
    titleA: r("titleA"),
    titleB: r("titleB"),
    none: r("none"),
    writeFirst: r("writeFirst"),
    write: r("write"),
    overall: r("overall"),
    count: (n: number) => r("count", { count: n }),
    inMarket: r("inMarket"),
    fromVerified: (n: number) => r("fromVerified", { count: n }),
    barLabel: (stars: number, n: number) => r("barLabel", { stars, count: n }),
    verifiedNote: r("verifiedNote"),
    honestNote: r("honestNote"),
    filter: r("filter"),
    all: (n: number) => r("all", { count: n }),
    verified: (n: number) => r("verified", { count: n }),
    removeStars: (n: number) => r("removeStars", { count: n }),
    sort: r("sort"),
    sorts: {
      useful: r("sorts.useful"),
      newest: r("sorts.newest"),
      rating_high: r("sorts.rating_high"),
      rating_low: r("sorts.rating_low"),
    },
    replied: r("replied", { brand }),
    readMore: r("readMore"),
    photoOf: (i: number, n: number) => r("photoOf", { index: i, count: n }),
    morePhotos: (n: number) => r("morePhotos", { count: n }),
    openPhotos: (n: number) => r("openPhotos", { count: n }),
    noMatch: r("noMatch"),
    loading: r("loading"),
    showing: (a: number, b: number) => r("showing", { shown: a, count: b }),
    viewMore: r("viewMore"),
    customer: r("customer"),
    verifiedBuyer: r("verifiedBuyer"),
    rated: (n: number) => r("rated", { count: n }),
    reviewOf: (title: string) => r("reviewOf", { title }),
    close: r("close"),
    helpful: r("helpful"),
    report: r("report"),
    reported: r("reported"),
    reportAsk: r("reportAsk"),
    yes: r("yes"),
    no: r("no"),
    reportThanks: r("reportThanks"),
    ratings: ["", r("ratings.1"), r("ratings.2"), r("ratings.3"), r("ratings.4"), r("ratings.5")],
    yourRating: r("yourRating"),
    starsOf: (n: number, label: string) => r("starsOf", { count: n, label }),
    titleOptional: r("titleOptional"),
    titleExample: r("titleExample"),
    yourReview: r("yourReview"),
    bodyHint: r("bodyHint"),
    minChars: r("minChars"),
    shownAs: r("shownAs"),
    nameHint: r("nameHint"),
    honest: r("honest"),
    posting: r("posting"),
    post: r("post"),
    panelNote: r("panelNote"),
    live: r("live"),
    pending: r("pending"),
    already: r("already"),
    notBought: r("notBought"),
    // Review link page (from the email)
    order: (n: string) => r("order", { number: n }),
    thanks: (name: string) => r("thanks", { name }),
    rateIntro: r("rateIntro"),
    thanksLive: r("thanksLive"),
    thanksPending: r("thanksPending"),
    doneLive: r("doneLive"),
    donePending: r("donePending"),
    shownAsName: r("shownAsName"),
    linkUntil: (d: string) => r("linkUntil", { date: d }),
    stopEmails: r("stopEmails"),
    unsubscribing: r("unsubscribing"),
    unsubscribed: r("unsubscribed"),
    unsubscribeFailed: r("unsubscribeFailed"),
    expired: r("expired"),
    notFound: r("notFound"),
    failed: r("failed"),
    goShop: r("goShop"),
    thanksOrder: r("thanksOrder"),
    noEmailsShort: r("noEmailsShort"),
    chooseRating: r("chooseRating"),
    postFailed: r("postFailed"),
    alreadyShort: r("alreadyShort"),
    ratingFor: (name: string) => r("ratingFor", { name }),
    bodyOptional: r("bodyOptional"),
  };
}

export type ReviewsCopy = ReturnType<typeof reviewsWording>;

/** Reviews wording for the page's language (the `[locale]` route). */
export function useReviewsCopy(): ReviewsCopy & { locale: ShopLocale } {
  const locale = useShopLocale();
  const t = useShopTranslator();
  return useMemo(
    () => ({ ...reviewsWording(t, brandDisplayName(locale)), locale }),
    [t, locale],
  );
}
