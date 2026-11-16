import { describe, expect, it } from "vitest";
import type { StoreDetail } from "../types";
import { storePageJsonLd } from "./storeJsonLd";
import { directionsUrl, mapsUrl, storePath, telUrl, whatsappUrl } from "./storeLinks";

const store = {
  slug: "yas-mall",
  areaSlug: "abu-dhabi",
  areaName: "Abu Dhabi",
  name: "Yas Mall",
  storeType: "SHOWROOM",
  openState: "OPEN",
  address: "Unit LG-013, Yas Mall, Abu Dhabi",
  city: "Abu Dhabi",
  countryCode: "AE",
  latitude: 24.49,
  longitude: 54.6,
  timeZone: "Asia/Dubai",
  phone: "+971 50 530 2866",
  whatsapp: null,
  regularHours: [{ day: "MON", open: "10:00", close: "22:00" }],
  specialHours: [],
  services: [],
  featured: false,
  googlePlaceId: "ChIJ123",
  googleMapsUri: null,
  googleRating: 4.6,
  googleReviewCount: 120,
  updatedAt: "2026-11-14T00:00:00Z",
  language: "en",
  area: { slug: "abu-dhabi", name: "Abu Dhabi", intro: "", seoTitle: null, seoDescription: null },
  directionsNote: null,
  description: "Flagship",
  email: null,
  photos: [{ url: "https://cdn.example.com/a.jpg", alt: "Shop front" }],
  googleReviewUri: null,
  seoTitle: null,
  seoDescription: null,
  permanentlyClosedAt: null,
  gone: false,
  nearby: [],
} satisfies StoreDetail;

describe("store links", () => {
  it("builds page, directions, maps, phone and WhatsApp links", () => {
    expect(storePath(store)).toBe("/stores/abu-dhabi/yas-mall");
    expect(directionsUrl(store)).toBe(
      "https://www.google.com/maps/dir/?api=1&destination=24.49%2C54.6&destination_place_id=ChIJ123",
    );
    expect(mapsUrl(store)).toBe("https://www.google.com/maps/search/?api=1&query=24.49%2C54.6&query_place_id=ChIJ123");
    expect(mapsUrl({ ...store, googleMapsUri: "https://maps.google.com/?cid=1" })).toBe("https://maps.google.com/?cid=1");
    expect(telUrl("+971 50 530 2866")).toBe("tel:+971505302866");
    expect(whatsappUrl("+971 50 530 2866")).toBe("https://wa.me/971505302866");
  });
});

describe("store structured data", () => {
  it("states what the page shows, with no rating", () => {
    const data = storePageJsonLd(store, "https://uae.example.com/stores/abu-dhabi/yas-mall", "Swiss Arabian");
    expect(data).toMatchObject({
      "@context": "https://schema.org",
      "@type": "Store",
      name: "Yas Mall",
      telephone: "+971 50 530 2866",
      geo: { latitude: 24.49, longitude: 54.6 },
      image: ["https://cdn.example.com/a.jpg"],
      parentOrganization: { name: "Swiss Arabian" },
      openingHoursSpecification: [{ dayOfWeek: "Monday", opens: "10:00", closes: "22:00" }],
    });
    expect(JSON.stringify(data)).not.toContain("aggregateRating");
  });
});
