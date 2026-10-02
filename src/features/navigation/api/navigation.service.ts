import { apiGet } from "@/lib/api/apiClient";
import { DEFAULT_ZONE_CODE, storefrontContextQuery } from "@/lib/storefront/context";
import type { NavigationPayload } from "../types/navigation";

export async function fetchNavigation(
  zoneCode: string = DEFAULT_ZONE_CODE,
): Promise<NavigationPayload> {
  const qs = storefrontContextQuery({ zoneCode });
  return apiGet<NavigationPayload>(`/storefront/navigation?${qs}`, {
    skipAuth: true,
  });
}
