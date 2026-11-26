import { apiDelete, apiGet, apiPost } from "@/lib/api/apiClient";
import { readGuestToken } from "@/features/cart/utils/guestToken";
import type {
  AuthResult,
  CustomerProfileView,
  CustomerSessionView,
  EmailLoginCodeConfirmPayload,
  EmailVerificationConfirmResult,
  IssuedCustomerToken,
  LoginPayload,
  OtpPurpose,
  PasswordLoginResult,
  PhoneCodeChannel,
  RegisterPayload,
  SignupConfirmResult,
  SignupPending,
} from "../types/auth";

export const authKeys = {
  all: ["auth"] as const,
  me: () => [...authKeys.all, "me"] as const,
  sessions: () => [...authKeys.all, "sessions"] as const,
  identities: () => [...authKeys.all, "identities"] as const,
};

export function toE164Phone(value: string): string {
  const trimmed = value.trim();
  const digits = trimmed.replace(/\D/g, "");
  if (!digits) return trimmed;
  return `+${digits}`;
}

export function toLoginIdentifier(value: string): string {
  const trimmed = value.trim();
  if (trimmed.includes("@")) return trimmed;
  return toE164Phone(trimmed);
}

export function splitFullName(fullName: string): {
  firstName: string;
  lastName?: string;
} {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] ?? "",
    lastName: parts.length > 1 ? parts.slice(1).join(" ") : undefined,
  };
}

/**
 * Adds the shopper's guest cart token to a sign-in request, so the API moves the
 * guest bag to the account (or adds its lines to the account's bag). Without it
 * the bag looks empty after signing in.
 */
export function withGuestToken<T extends { guestToken?: string }>(payload: T): T {
  if (payload.guestToken) return payload;
  const guestToken = readGuestToken();
  return guestToken ? { ...payload, guestToken } : payload;
}

/** Starts a sign-up: a code goes to the email and to the mobile; nothing is created yet. */
export async function registerCustomer(payload: RegisterPayload): Promise<SignupPending> {
  return apiPost<SignupPending>("/storefront/auth/register", payload, { skipAuth: true });
}

/** Confirms one or both sign-up codes; with both the account exists and the session starts. */
export async function confirmSignup(payload: {
  signupId: string;
  emailCode?: string;
  phoneCode?: string;
}): Promise<SignupConfirmResult> {
  return apiPost<SignupConfirmResult>(
    "/storefront/auth/register/confirm",
    withGuestToken<typeof payload & { guestToken?: string }>(payload),
    { skipAuth: true },
  );
}

export async function resendSignupCode(payload: {
  signupId: string;
  target: "EMAIL" | "PHONE";
  phoneChannel?: PhoneCodeChannel;
}): Promise<SignupPending> {
  return apiPost<SignupPending>("/storefront/auth/register/resend", payload, { skipAuth: true });
}

/** Sign-in code by mobile: only a number the customer verified receives it. */
export async function requestPhoneLoginCode(phone: string, channel?: PhoneCodeChannel) {
  return apiPost<{ success: boolean; message: string }>(
    "/storefront/auth/login/phone-code/request",
    { phone, ...(channel ? { channel } : {}) },
    { skipAuth: true },
  );
}

export async function confirmPhoneLoginCode(payload: {
  phone: string;
  code: string;
  guestToken?: string;
}): Promise<AuthResult> {
  return apiPost<AuthResult>(
    "/storefront/auth/login/phone-code/confirm",
    withGuestToken(payload),
    { skipAuth: true },
  );
}

export async function loginCustomer(
  payload: LoginPayload,
): Promise<PasswordLoginResult> {
  return apiPost<PasswordLoginResult>(
    "/storefront/auth/login",
    withGuestToken(payload),
    { skipAuth: true },
  );
}

export async function requestEmailLoginCode(email: string) {
  return apiPost<{ success: boolean; message: string }>(
    "/storefront/auth/login/email-code/request",
    { email },
    { skipAuth: true },
  );
}

export async function confirmEmailLoginCode(
  payload: EmailLoginCodeConfirmPayload,
): Promise<AuthResult> {
  return apiPost<AuthResult>(
    "/storefront/auth/login/email-code/confirm",
    withGuestToken(payload),
    { skipAuth: true },
  );
}

export async function refreshCustomerSession(
  refreshToken: string,
): Promise<{ token: IssuedCustomerToken }> {
  return apiPost<{ token: IssuedCustomerToken }>(
    "/storefront/auth/refresh",
    { refreshToken },
    { skipAuth: true },
  );
}

export async function logoutCustomer(): Promise<{ success: boolean }> {
  return apiPost<{ success: boolean }>("/storefront/auth/logout");
}

export async function logoutAllCustomerSessions(): Promise<{
  revokedCount: number;
}> {
  return apiPost<{ revokedCount: number }>("/storefront/auth/logout-all");
}

export async function fetchCustomerMe(): Promise<CustomerProfileView> {
  return apiGet<CustomerProfileView>("/storefront/customer/me");
}

export async function fetchCustomerSessions(): Promise<CustomerSessionView[]> {
  return apiGet<CustomerSessionView[]>("/storefront/customer/sessions");
}

export async function revokeCustomerSession(
  sessionId: string,
): Promise<{ success: boolean }> {
  return apiDelete<{ success: boolean }>(
    `/storefront/customer/sessions/${encodeURIComponent(sessionId)}`,
  );
}

export async function changeCustomerPassword(payload: {
  currentPassword: string;
  newPassword: string;
}): Promise<{ success: boolean }> {
  return apiPost<{ success: boolean }>(
    "/storefront/customer/change-password",
    payload,
  );
}

export async function requestEmailVerification(email: string) {
  return apiPost<{ success: boolean; message: string }>(
    "/storefront/auth/verify-email/request",
    { email },
    { skipAuth: true },
  );
}

/** `signIn` asks for the session too, so the shopper is not sent to type the password again. */
export async function confirmEmailVerification(
  email: string,
  code: string,
  options: { signIn?: boolean } = {},
) {
  return apiPost<EmailVerificationConfirmResult>(
    "/storefront/auth/verify-email/confirm",
    options.signIn
      ? withGuestToken<{ email: string; code: string; signIn: true; guestToken?: string }>(
          { email, code, signIn: true },
        )
      : { email, code },
    { skipAuth: true },
  );
}

/** Signed in: sends a code to one of your own numbers (it is verified on your account only). */
export async function requestPhoneVerification(phone: string, channel?: PhoneCodeChannel) {
  return apiPost<{ success: boolean }>("/storefront/auth/verify-phone/request", {
    phone,
    ...(channel ? { channel } : {}),
  });
}

export async function confirmPhoneVerification(phone: string, code: string) {
  return apiPost<{ success: boolean }>("/storefront/auth/verify-phone/confirm", { phone, code });
}

export async function forgotPassword(identifier: string) {
  return apiPost<{ success: boolean; message: string }>(
    "/storefront/auth/forgot-password",
    { identifier },
    { skipAuth: true },
  );
}

export async function resetPassword(payload: {
  identifier: string;
  code: string;
  newPassword: string;
}) {
  return apiPost<{ success: boolean }>(
    "/storefront/auth/reset-password",
    payload,
    { skipAuth: true },
  );
}

export async function resendOtp(identifier: string, purpose: OtpPurpose) {
  return apiPost<{ success: boolean; message: string }>(
    "/storefront/auth/otp/resend",
    { identifier, purpose },
    { skipAuth: true },
  );
}
