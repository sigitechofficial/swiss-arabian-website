import { endSession } from "@/lib/auth/endSession";
import { apiPost } from "@/lib/api/apiClient";

export async function performLogout(): Promise<void> {
  try {
    await apiPost("/store/auth/logout");
  } catch {
    // Always clear local session even if server logout fails.
  } finally {
    endSession();
  }
}
