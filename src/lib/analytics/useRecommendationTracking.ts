"use client";

import { useEffect, useRef, type MouseEvent, type RefObject } from "react";
import {
  trackRecommendationClicked,
  trackRecommendationImpression,
  type RecommendedProduct,
} from "./siteEvents";

/** The product slug in a product link (`/en/products/rose-01` → `rose-01`). */
export function productSlugFromHref(href: string | null | undefined): string | null {
  if (!href) return null;
  const tail = href.split(/[?#]/)[0].split("/products/")[1];
  const slug = tail?.split("/")[0];
  return slug ? decodeURIComponent(slug) : null;
}

/**
 * Which recommended product a click belongs to: an element marked `data-rec-index`, else the one
 * product the clicked card links to (cards are not changed for tracking). -1 when unknown.
 */
export function recommendationIndexForClick(
  target: Element,
  root: Element,
  products: readonly RecommendedProduct[],
): number {
  const marked = target.closest("[data-rec-index]");
  if (marked && root.contains(marked)) {
    const index = Number(marked.getAttribute("data-rec-index"));
    if (Number.isInteger(index) && products[index]) return index;
  }
  for (let el: Element | null = target; el && el !== root; el = el.parentElement) {
    const links = [
      ...(el.matches("a[href*='/products/']") ? [el] : []),
      ...Array.from(el.querySelectorAll("a[href*='/products/']")),
    ];
    const slugs = new Set(links.map((a) => productSlugFromHref(a.getAttribute("href"))).filter(Boolean));
    if (slugs.size > 1) return -1;
    if (slugs.size === 1) {
      const [slug] = [...slugs];
      return products.findIndex((p) => p.slug === slug);
    }
  }
  return -1;
}

/**
 * Recommendation tracking for one section: each product is recorded as shown once the section comes
 * into view, and a click anywhere on a product's card records a recommendation click. Put `ref` and
 * `onClickCapture` on the section element. Events follow the shopper's analytics consent (`track`).
 */
export function useRecommendationTracking<T extends HTMLElement = HTMLElement>(
  surface: string,
  products: readonly RecommendedProduct[],
  /** The section's own ref, when the component already has one. */
  existingRef?: RefObject<T | null>,
) {
  const ownRef = useRef<T>(null);
  const ref = existingRef ?? ownRef;
  const productsRef = useRef(products);
  useEffect(() => {
    productsRef.current = products;
  }, [products]);
  const key = products.map((p) => p.id ?? p.slug ?? "").join(",");

  useEffect(() => {
    const el = ref.current;
    if (!el || !key) return;
    const send = () =>
      productsRef.current.forEach((p, i) => trackRecommendationImpression(surface, p, i + 1));
    if (typeof IntersectionObserver === "undefined") {
      send();
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        send();
        observer.disconnect();
      },
      // Any part of the section on screen: a tall section never shows a quarter of itself.
      { threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [surface, key, ref]);

  // The section the handler is on is the click's currentTarget.
  const onClickCapture = (event: MouseEvent<T>) => {
    const root = event.currentTarget;
    const target = event.target instanceof Element ? event.target : null;
    if (!root || !target) return;
    const index = recommendationIndexForClick(target, root, productsRef.current);
    if (index >= 0) trackRecommendationClicked(surface, productsRef.current[index], index + 1);
  };

  return { ref, onClickCapture };
}
