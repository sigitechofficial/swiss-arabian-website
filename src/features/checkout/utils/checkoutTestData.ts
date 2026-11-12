import type { AppEnv } from "@/lib/config/env";
import type { AddressFields } from "./addressSnapshot";

/** Markets that get the "Fill test data" button (country codes). */
const TEST_DATA_COUNTRIES = ["AE", "SA"] as const;
type TestDataCountry = (typeof TEST_DATA_COUNTRIES)[number];

export type CheckoutTestData = { email: string; shipping: AddressFields };

/**
 * Guest checkout details for test orders. Clearly marked as a test so the
 * order is easy to spot (and cancel) in the admin, D365 and courier systems.
 * Emails use example.com (reserved, never delivered).
 */
const TEST_DATA: Record<TestDataCountry, CheckoutTestData> = {
  AE: {
    email: "test.order.uae@example.com",
    shipping: {
      fullName: "Test Order UAE",
      phone: "+971501234567",
      address1: "Sheikh Zayed Road, Building 12",
      address2: "Apartment 304 — TEST ORDER, do not ship",
      city: "Dubai",
      emirate: "Dubai",
      postalCode: "",
    },
  },
  SA: {
    email: "test.order.ksa@example.com",
    shipping: {
      fullName: "Test Order KSA",
      phone: "+966501234567",
      address1: "King Fahd Road, Building 8",
      address2: "Apartment 12 — TEST ORDER, do not ship",
      city: "Riyadh",
      emirate: "Riyadh",
      postalCode: "12211",
    },
  },
};

/**
 * Test data for this checkout, or null when the button must not show:
 * production site, a signed-in shopper, or a market other than UAE / KSA.
 */
export function checkoutTestDataFor(input: {
  appEnv: AppEnv;
  isAuthenticated: boolean;
  countryCode: string | null | undefined;
}): CheckoutTestData | null {
  if (input.appEnv === "production" || input.isAuthenticated) return null;
  const country = (input.countryCode ?? "").toUpperCase();
  return (TEST_DATA_COUNTRIES as readonly string[]).includes(country)
    ? TEST_DATA[country as TestDataCountry]
    : null;
}
