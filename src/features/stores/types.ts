/**
 * Store locator data from the storefront API (`/storefront/stores…`).
 * Contract: backend docs/frontend/STORE_LOCATOR_API.md (branch feat/store-locator).
 */

export type StoreDay = "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN";
export type StoreType = "SHOWROOM" | "KIOSK" | "OUTLET" | "OTHER";
export type StoreOpenState = "OPEN" | "OPENING_SOON" | "CLOSED_TEMPORARILY" | "CLOSED_PERMANENTLY";
export type StoreService = "gift-wrapping" | "testers" | "consultation" | "engraving" | "parking" | "wheelchair-access";

/** One opening period; `close` at or before `open` runs past midnight, "24:00" / "00:00" = midnight. */
export type RegularPeriod = { day: StoreDay; open: string; close: string };

/** A date (or range) with its own hours; the label is already in the page's language. */
export type SpecialHours = {
  date: string;
  endDate?: string;
  closed?: boolean;
  open?: string;
  close?: string;
  label?: string;
};

export type StoreCard = {
  slug: string;
  areaSlug: string;
  areaName: string;
  name: string;
  storeType: StoreType;
  openState: StoreOpenState;
  address: string;
  city: string;
  countryCode: string;
  latitude: number;
  longitude: number;
  timeZone: string;
  phone: string | null;
  whatsapp: string | null;
  regularHours: RegularPeriod[];
  specialHours: SpecialHours[];
  services: StoreService[];
  featured: boolean;
  googlePlaceId: string | null;
  googleMapsUri: string | null;
  googleRating: number | null;
  googleReviewCount: number | null;
  updatedAt: string;
};

export type StoreAreaText = {
  slug: string;
  name: string;
  intro: string;
  seoTitle: string | null;
  seoDescription: string | null;
};

export type StoreAreaSummary = { slug: string; name: string; storeCount: number };

export type StoreLocatorData = {
  language: string;
  areas: StoreAreaSummary[];
  stores: StoreCard[];
};

export type StoreAreaData = {
  language: string;
  area: StoreAreaText;
  stores: StoreCard[];
  otherAreas: Array<{ slug: string; name: string }>;
};

export type StoreDetail = StoreCard & {
  language: string;
  area: StoreAreaText;
  directionsNote: string | null;
  description: string | null;
  email: string | null;
  photos: Array<{ url: string; alt: string }>;
  googleReviewUri: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  permanentlyClosedAt: string | null;
  /** Closed for good more than 90 days ago: the page redirects to its area. */
  gone: boolean;
  nearby: Array<StoreCard & { distanceKm: number }>;
};

export type StoreSlugs = {
  areas: Array<{ slug: string; updatedAt: string }>;
  stores: Array<{ slug: string; areaSlug: string; updatedAt: string }>;
};
