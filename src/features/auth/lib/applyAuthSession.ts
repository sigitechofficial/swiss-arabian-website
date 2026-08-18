import { setTokens } from "@/lib/auth/token";
import { insiderIdentify } from "@/lib/insider";
import {
  DEFAULT_LANGUAGE_CODE,
  DEFAULT_ZONE_CODE,
} from "@/lib/storefront/context";
import { useAuthStore, type StoreUser } from "@/stores/useAuthStore";
import type { AuthResult, CustomerProfileView } from "../types/auth";

function stitchInsiderSession(customer: CustomerProfileView): void {
  insiderIdentify({
    uuid: customer.id,
    email: customer.email,
    phone: customer.phoneE164,
    firstName: customer.firstName,
    lastName: customer.lastName,
    zoneCode: DEFAULT_ZONE_CODE,
    locale: DEFAULT_LANGUAGE_CODE,
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

/** Persist tokens + hydrate Zustand from AuthResult. */
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
