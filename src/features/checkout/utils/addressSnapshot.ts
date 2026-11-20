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
    phone: toE164Phone(fields.phone),
  };
  // Only a postcode the shopper gave is stored: the UAE has none, and a stand-in
  // value would show on order pages and travel to carriers and D365. Payment
  // providers that need one get their own default at their boundary.
  if (fields.postalCode?.trim()) snapshot.postalCode = fields.postalCode.trim();
  if (fields.address2?.trim()) snapshot.address2 = fields.address2.trim();
  if (fields.emirate) snapshot.province = fields.emirate;
  if (extra.email?.trim()) snapshot.email = extra.email.trim();
  return snapshot;
}
