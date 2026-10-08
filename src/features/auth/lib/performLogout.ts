import { apiPost } from "@/lib/api/apiClient";
import { endSession } from "@/lib/auth/endSession";
import { getAccessToken } from "@/lib/auth/token";

/**
 * Clear the local session first so Logout never waits on a dead /me or refresh.
 * Then revoke the server session with the captured token (401 must not refresh).
 */
async function revokeOnServer(
  path: "/storefront/auth/logout" | "/storefront/auth/logout-all",
): Promise<void> {
  const accessToken = getAccessToken();
  endSession();
  if (!accessToken) return;
  try {
    await apiPost(path, undefined, {
      skipAuth: true,
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  } catch {
    // Already signed out locally.
  }
}

export async function performLogout(): Promise<void> {
  await revokeOnServer("/storefront/auth/logout");
}

export async function performLogoutAll(): Promise<void> {
  await revokeOnServer("/storefront/auth/logout-all");
}
