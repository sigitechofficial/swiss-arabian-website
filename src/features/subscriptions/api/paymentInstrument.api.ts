import { apiGet, apiPost } from "@/lib/api/apiClient";

export type SetupSessionResponse = {
  instrumentId: string;
  status: string;
  providerCode: string;
  clientSecret: string;
  publishableKey: string | null;
};

export type PaymentInstrumentSummary = {
  id: string;
  status: string;
  providerCode: string;
  cardBrand: string | null;
  last4: string | null;
  expiryMonth: number | null;
  expiryYear: number | null;
  isDefault: boolean;
  createdAt: string;
};

export type SetupSessionBody = {
  zoneCode: string;
  recurringUseAccepted: true;
  consentTextVersion: string;
};

export async function createSetupSession(body: SetupSessionBody): Promise<SetupSessionResponse> {
  return apiPost<SetupSessionResponse>("/storefront/payment-instruments/setup-session", body);
}

export async function listPaymentInstruments(zoneCode: string): Promise<PaymentInstrumentSummary[]> {
  const data = await apiGet<{ items: PaymentInstrumentSummary[] }>(
    `/storefront/payment-instruments?zoneCode=${encodeURIComponent(zoneCode)}`,
  );
  return data.items ?? [];
}
