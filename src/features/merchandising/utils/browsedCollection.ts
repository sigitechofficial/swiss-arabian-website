"use client";

import { useMemo, useSyncExternalStore } from "react";
import type { ProductCollectionRef } from "@/features/catalog/types/product";

/**
 * The collection the shopper is browsing, kept for this browser tab only.
 * A product opened from that collection shows it in its breadcrumb (like
 * Shopify's /collections/x/products/y), while the product's address stays the
 * one canonical /products/y.
 */
const KEY = "sa-browsed-collection";

export function rememberBrowsedCollection(collection: { slug: string; name: string }) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ slug: collection.slug, name: collection.name }));
  } catch {
    // Private mode / storage off: breadcrumbs fall back to the product's own collection.
  }
}

function parseBrowsedCollection(raw: string | null): { slug: string; name: string } | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { slug?: unknown; name?: unknown };
    return typeof parsed.slug === "string" && typeof parsed.name === "string"
      ? { slug: parsed.slug, name: parsed.name }
      : null;
  } catch {
    return null;
  }
}

function readRaw(): string | null {
  try {
    return sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
}

const noSubscription = () => () => {};

/** The browsed collection when this product is in it (in this market), else null. */
export function pickBrowsedCollection(
  browsed: { slug: string } | null,
  collections?: ProductCollectionRef[] | null,
): ProductCollectionRef | null {
  if (!browsed) return null;
  return collections?.find((c) => c.slug === browsed.slug) ?? null;
}

export function useBrowsedCollection(collections?: ProductCollectionRef[] | null) {
  // Client-only value (server render: none), read without effects.
  const raw = useSyncExternalStore(noSubscription, readRaw, () => null);
  const browsed = useMemo(() => parseBrowsedCollection(raw), [raw]);
  return pickBrowsedCollection(browsed, collections);
}
