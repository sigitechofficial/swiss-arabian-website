import { env } from "@/lib/config/env";
import {
  confirmPhoneVerification,
  requestPhoneVerification,
} from "../api/auth.service";

/**
 * Local development only. The same six-digit code the shopper already typed
 * is offered to the existing phone confirmation when the local API is in use.
 * Production builds and non-local APIs skip this. A failure leaves the
 * customer signed in without an employee link.
 */
export function shouldConfirmStoredPhoneWithSameCode(input?: {
  appEnv?: string;
  nodeEnv?: string;
  useLocalApi?: boolean;
}): boolean {
  const appEnv = input?.appEnv ?? env.appEnv;
  const nodeEnv = input?.nodeEnv ?? process.env.NODE_ENV;
  const useLocalApi = input?.useLocalApi ?? env.flags.useLocalApi;
  return appEnv !== "production" && nodeEnv !== "production" && useLocalApi;
}

export async function confirmStoredPhoneWithSameCode(input: {
  phoneE164: string | null | undefined;
  code: string;
}): Promise<boolean> {
  const phone = input.phoneE164?.trim() ?? "";
  if (!phone || !shouldConfirmStoredPhoneWithSameCode()) {
    return false;
  }
  await requestPhoneVerification(phone);
  await confirmPhoneVerification(phone, input.code);
  return true;
}
