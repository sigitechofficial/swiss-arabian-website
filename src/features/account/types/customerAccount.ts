/** Phase 2 storefront customer account types — guide + Swagger. */

export type CustomerAddressType = "SHIPPING" | "BILLING" | "BOTH";

export type StorefrontCustomerAddressView = {
  id: string;
  type: string;
  firstName: string | null;
  lastName: string | null;
  fullName: string | null;
  company: string | null;
  address1: string;
  address2: string | null;
  city: string | null;
  province: string | null;
  provinceCode: string | null;
  postalCode: string | null;
  country: string | null;
  countryCode: string | null;
  phoneE164: string | null;
  isDefaultShipping: boolean;
  isDefaultBilling: boolean;
};

export type CreateCustomerAddressDto = {
  type?: CustomerAddressType;
  firstName?: string;
  lastName?: string;
  company?: string | null;
  address1: string;
  address2?: string | null;
  city?: string;
  province?: string;
  provinceCode?: string;
  postalCode?: string;
  country?: string;
  countryCode?: string;
  phone?: string;
  zoneId?: string;
  isDefaultShipping?: boolean;
  isDefaultBilling?: boolean;
};

export type UpdateCustomerAddressDto = Partial<CreateCustomerAddressDto>;

export type AddressDefaultTarget = "shipping" | "billing" | "both";

export type CustomerPhoneUsage =
  | "PRIMARY"
  | "SHIPPING"
  | "BILLING"
  | "WHATSAPP"
  | "OTHER";

export type StorefrontCustomerPhoneView = {
  id: string;
  phoneRaw: string;
  phoneE164: string;
  countryCode: string | null;
  usage: string;
  isPrimary: boolean;
  isVerified: boolean;
};

export type CreateCustomerPhoneDto = {
  phone: string;
  countryCode?: string;
  usage?: CustomerPhoneUsage;
  isPrimary?: boolean;
};

export type UpdateCustomerPhoneDto = {
  phone?: string;
  countryCode?: string;
  usage?: CustomerPhoneUsage;
};

export type StorefrontCustomerProfileView = {
  id: string;
  email: string | null;
  phoneE164: string | null;
  firstName: string | null;
  lastName: string | null;
  fullName: string | null;
  zoneId: string | null;
  preferredCountryCode: string | null;
  preferredCurrencyCode: string | null;
  preferredLocale: string | null;
  isEmailVerified: boolean;
  dateOfBirth: string | null;
  gender: string | null;
};

export type UpdateCustomerProfileDto = {
  firstName?: string;
  lastName?: string;
  preferredCountryCode?: string;
  preferredCurrencyCode?: string;
  preferredLocale?: string;
  dateOfBirth?: string;
  gender?: string;
};

/** A channel the platform can send marketing on (the backend lists the ones in use). */
export type MarketingChannel = "EMAIL" | "SMS" | "WHATSAPP" | "PUSH";

/**
 * The shopper's marketing choices, one per channel the platform sends
 * marketing on today. `subscribed` is exactly what the sender decides.
 */
export type CommunicationPreferences = {
  channels: Array<{ channel: MarketingChannel; subscribed: boolean }>;
};

export type MutationAck = {
  success: boolean;
};
