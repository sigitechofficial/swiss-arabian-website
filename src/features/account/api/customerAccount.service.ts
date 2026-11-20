import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from "@/lib/api/apiClient";

import type {
  AddressDefaultTarget,
  CommunicationPreferences,
  CreateCustomerAddressDto,
  CreateCustomerPhoneDto,
  MarketingChannel,
  MutationAck,
  StorefrontCustomerAddressView,
  StorefrontCustomerPhoneView,
  StorefrontCustomerProfileView,
  UpdateCustomerAddressDto,
  UpdateCustomerPhoneDto,
  UpdateCustomerProfileDto,
} from "../types/customerAccount";

const BASE = "/storefront/customer";

export async function updateCustomerMe(
  dto: UpdateCustomerProfileDto,
): Promise<StorefrontCustomerProfileView> {
  return apiPatch<StorefrontCustomerProfileView>(`${BASE}/me`, dto);
}

export async function listCustomerAddresses(): Promise<
  StorefrontCustomerAddressView[]
> {
  return apiGet<StorefrontCustomerAddressView[]>(`${BASE}/addresses`);
}

export async function createCustomerAddress(
  dto: CreateCustomerAddressDto,
): Promise<StorefrontCustomerAddressView> {
  return apiPost<StorefrontCustomerAddressView>(`${BASE}/addresses`, dto);
}

export async function updateCustomerAddress(
  addressId: string,
  dto: UpdateCustomerAddressDto,
): Promise<StorefrontCustomerAddressView> {
  return apiPatch<StorefrontCustomerAddressView>(
    `${BASE}/addresses/${encodeURIComponent(addressId)}`,
    dto,
  );
}

export async function deleteCustomerAddress(
  addressId: string,
): Promise<MutationAck> {
  return apiDelete<MutationAck>(
    `${BASE}/addresses/${encodeURIComponent(addressId)}`,
  );
}

export async function setDefaultCustomerAddress(
  addressId: string,
  target: AddressDefaultTarget = "both",
): Promise<StorefrontCustomerAddressView> {
  return apiPatch<StorefrontCustomerAddressView>(
    `${BASE}/addresses/${encodeURIComponent(addressId)}/default`,
    { target },
  );
}

export async function listCustomerPhones(): Promise<
  StorefrontCustomerPhoneView[]
> {
  return apiGet<StorefrontCustomerPhoneView[]>(`${BASE}/phones`);
}

export async function createCustomerPhone(
  dto: CreateCustomerPhoneDto,
): Promise<StorefrontCustomerPhoneView> {
  return apiPost<StorefrontCustomerPhoneView>(`${BASE}/phones`, dto);
}

export async function updateCustomerPhone(
  phoneId: string,
  dto: UpdateCustomerPhoneDto,
): Promise<StorefrontCustomerPhoneView> {
  return apiPatch<StorefrontCustomerPhoneView>(
    `${BASE}/phones/${encodeURIComponent(phoneId)}`,
    dto,
  );
}

export async function deleteCustomerPhone(
  phoneId: string,
): Promise<MutationAck> {
  return apiDelete<MutationAck>(
    `${BASE}/phones/${encodeURIComponent(phoneId)}`,
  );
}

export async function setDefaultCustomerPhone(
  phoneId: string,
): Promise<StorefrontCustomerPhoneView> {
  return apiPatch<StorefrontCustomerPhoneView>(
    `${BASE}/phones/${encodeURIComponent(phoneId)}/default`,
  );
}

/** The shopper's marketing choices per channel. */
export async function getCommunicationPreferences(): Promise<CommunicationPreferences> {
  return apiGet<CommunicationPreferences>(`${BASE}/communication-preferences`);
}

/** Turn marketing on one channel on or off (every market of the account). */
export async function setCommunicationPreference(
  channel: MarketingChannel,
  subscribed: boolean,
): Promise<CommunicationPreferences> {
  return apiPut<CommunicationPreferences>(`${BASE}/communication-preferences`, {
    channel,
    subscribed,
  });
}
