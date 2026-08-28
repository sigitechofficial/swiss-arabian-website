import type { CheckoutAddressSnapshot } from "../types/checkout";

const COUNTRY_CODE_MAP: Record<string, string> = {
  "United Arab Emirates": "AE",
  "Saudi Arabia": "SA",
  Qatar: "QA",
  Kuwait: "KW",
  Bahrain: "BH",
  Oman: "OM",
};

export function toCountryCode(display: string): string {
  return COUNTRY_CODE_MAP[display] ?? "AE";
}

type AddressFormSlice = {
  firstName: string;
  lastName: string;
  address: string;
  apartment?: string;
  city: string;
  country: string;
  phone: string;
};

/** Shipping/billing snapshot for POST …/address. Does not include emirate (existing shipping shape). */
export function buildAddressSnapshot(data: AddressFormSlice): CheckoutAddressSnapshot {
  return {
    fullName: `${data.firstName} ${data.lastName}`.trim(),
    address1: data.address,
    address2: data.apartment || undefined,
    city: data.city,
    countryCode: toCountryCode(data.country),
    postalCode: "00000",
    phone: data.phone,
  };
}
