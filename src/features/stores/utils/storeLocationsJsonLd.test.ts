import { describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({ headers: vi.fn() }));

import { storeLocationsJsonLd } from "./storeLocationsJsonLd";

describe("storeLocationsJsonLd", () => {
  it("maps the store list to Store entries, with readable hours only", () => {
    const data = JSON.parse(
      JSON.stringify(
        storeLocationsJsonLd(
          [
            {
              id: "damac",
              name: "Damac Hills Kiosk",
              address: "Damac Hills, Dubai",
              phone: "+971 52 000 0000",
              hours: "Mon–Sat 10:00 AM–10:00 PM · Sun 10:00 AM–12:00 AM",
              lat: 25.02,
              lng: 55.25,
            },
            { id: "souk", name: "Souk", address: "Shop 4, Abu Dhabi", hours: "Ask in store", lat: 24.4, lng: 54.3 },
          ],
          { pageUrl: "/stores", brandName: "Swiss Arabian", countryCode: "AE" },
        ),
      ),
    );
    const [damac, souk] = data["@graph"];
    expect(damac.openingHoursSpecification).toHaveLength(2);
    expect(damac.telephone).toBe("+971 52 000 0000");
    expect(damac.geo).toEqual({ "@type": "GeoCoordinates", latitude: 25.02, longitude: 55.25 });
    expect(damac.address).toEqual({
      "@type": "PostalAddress",
      streetAddress: "Damac Hills, Dubai",
      addressCountry: "AE",
    });
    expect(souk.openingHoursSpecification).toBeUndefined();
    expect(souk.telephone).toBeUndefined();
    expect(souk.parentOrganization).toEqual({ "@type": "Organization", name: "Swiss Arabian" });
  });
});
