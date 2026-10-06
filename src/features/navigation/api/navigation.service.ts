import { apiGet } from "@/lib/api/apiClient";
import { storefrontContextQuery } from "@/lib/storefront/context";
import type { NavigationPayload } from "../types/navigation";

export async function fetchNavigation(zoneCode: string): Promise<NavigationPayload> {
  const qs = storefrontContextQuery({ zoneCode });
  return apiGet<NavigationPayload>(`/storefront/navigation?${qs}`, {
    skipAuth: true,
  });
}
