import { apiGet } from "@/lib/api/apiClient";
import { DEFAULT_ZONE_CODE } from "@/lib/storefront/context";
import type { NavigationPayload } from "../types/navigation";

/**
 * GET /storefront/navigation?zoneCode=UAE
 * Public endpoint — no auth required.
 */
export async function fetchNavigation(
  zoneCode: string = DEFAULT_ZONE_CODE,
): Promise<NavigationPayload> {
  return apiGet<NavigationPayload>(
    `/storefront/navigation?zoneCode=${encodeURIComponent(zoneCode)}`,
    { skipAuth: true },
  );
}
