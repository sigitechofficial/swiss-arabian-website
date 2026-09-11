import { toE164Phone } from "@/features/auth/api/auth.service";
import type { CheckoutAddressSnapshot } from "../types/checkout";

/** What the checkout form collects for one address. */
export type AddressFields = {
  fullName: string;
  phone: string;
  address1: string;
  address2?: string;
  city: string;
  emirate: string;
  postalCode?: string;
};

/**
 * Build the JSON the address endpoint stores. The snapshot is free-form (the
 * spec types it as a plain object), so the emirate travels as `province` and
 * the contact email rides along — there's no other endpoint to attach a guest's
 * email once the session exists.
 */
export function buildAddressSnapshot(
  fields: AddressFields,
  extra: { email?: string; countryCode?: string | null } = {},
): CheckoutAddressSnapshot {
  const snapshot: CheckoutAddressSnapshot = {
    fullName: fields.fullName.trim(),
    address1: fields.address1.trim(),
    city: fields.city.trim(),
    countryCode: extra.countryCode || "AE",
    // The UAE doesn't use postcodes; "00000" is the placeholder the reference
    // storefront sends when none is entered.
    postalCode: fields.postalCode?.trim() || "00000",
    phone: toE164Phone(fields.phone),
  };
  if (fields.address2?.trim()) snapshot.address2 = fields.address2.trim();
  if (fields.emirate) snapshot.province = fields.emirate;
  if (extra.email?.trim()) snapshot.email = extra.email.trim();
  return snapshot;
}
