import { env } from "@/lib/config/env";
import {
  confirmPhoneVerification,
  requestPhoneVerification,
} from "../api/auth.service";

/**
 * Local development only (APP_ENV=local, `next dev`). The same six-digit code
 * the shopper already typed is offered to the existing phone confirmation.
 * Every deployed environment skips this. A failure leaves the customer signed
 * in without an employee link.
 */
export function shouldConfirmStoredPhoneWithSameCode(input?: {
  appEnv?: string;
  nodeEnv?: string;
}): boolean {
  const appEnv = input?.appEnv ?? env.appEnv;
  const nodeEnv = input?.nodeEnv ?? process.env.NODE_ENV;
  return appEnv === "local" && nodeEnv !== "production";
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
