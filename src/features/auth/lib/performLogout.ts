import { endSession } from "@/lib/auth/endSession";
import {
  logoutAllCustomerSessions,
  logoutCustomer,
} from "../api/auth.service";

export async function performLogout(): Promise<void> {
  try {
    await logoutCustomer();
  } catch {
    // Always clear local session even if server logout fails.
  } finally {
    endSession();
  }
}

export async function performLogoutAll(): Promise<void> {
  try {
    await logoutAllCustomerSessions();
  } catch {
    // clear locally anyway
  } finally {
    endSession();
  }
}
