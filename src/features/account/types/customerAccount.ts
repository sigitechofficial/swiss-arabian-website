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

export type ConsentChannel = "EMAIL" | "SMS" | "WHATSAPP" | "PUSH";
export type ConsentStatus = "OPTED_IN" | "OPTED_OUT" | "UNKNOWN";

export type StorefrontMarketingConsentView = {
  channel: string;
  status: string;
  zoneId: string | null;
  consentedAt: string | null;
  revokedAt: string | null;
};

export type UpdateMarketingConsentsDto = {
  consents: Array<{
    channel: ConsentChannel;
    status: ConsentStatus;
    zoneId?: string;
  }>;
};

export type MutationAck = {
  success: boolean;
};
