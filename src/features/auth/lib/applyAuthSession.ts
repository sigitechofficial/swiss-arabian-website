import { setTokens } from "@/lib/auth/token";
import { insiderIdentify } from "@/lib/insider";
import { useAuthStore, type StoreUser } from "@/stores/useAuthStore";
import { useUiStore } from "@/stores/useUiStore";
import type { AuthResult, CustomerProfileView } from "../types/auth";

function stitchInsiderSession(customer: CustomerProfileView): void {
  const saved = useUiStore.getState();
  insiderIdentify({
    uuid: customer.id,
    email: customer.email,
    phone: customer.phoneE164,
    firstName: customer.firstName,
    lastName: customer.lastName,
    zoneCode: saved.catalogContext?.zoneCode || saved.selectedMarketId || "",
    locale: saved.catalogContext?.languageCode || "en",
  });
}

export function mapCustomerToStoreUser(
  customer: CustomerProfileView,
): StoreUser {
  return {
    id: customer.id,
    email: customer.email ?? customer.phoneE164 ?? "",
    firstName: customer.firstName ?? undefined,
    lastName: customer.lastName ?? undefined,
    fullName: customer.fullName ?? undefined,
    phoneE164: customer.phoneE164 ?? undefined,
    zoneId: customer.zoneId ?? undefined,
    isEmailVerified: customer.isEmailVerified,
  };
}

export function applyAuthResult(result: AuthResult): StoreUser {
  setTokens(result.token.accessToken, result.token.refreshToken);
  const user = mapCustomerToStoreUser(result.customer);
  useAuthStore.getState().setUser(user);
  useAuthStore.getState().setBootstrapped(true);
  stitchInsiderSession(result.customer);
  return user;
}

export function applyCustomerProfile(customer: CustomerProfileView): StoreUser {
  const user = mapCustomerToStoreUser(customer);
  useAuthStore.getState().setUser(user);
  stitchInsiderSession(customer);
  return user;
}
