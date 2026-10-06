import { apiDelete, apiGet, apiPost } from "@/lib/api/apiClient";
import type {
  AuthResult,
  CustomerProfileView,
  CustomerSessionView,
  EmailLoginCodeConfirmPayload,
  IssuedCustomerToken,
  LoginPayload,
  OtpPurpose,
  PasswordLoginResult,
  RegisterPayload,
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

export async function registerCustomer(
  payload: RegisterPayload,
): Promise<AuthResult> {
  return apiPost<AuthResult>("/storefront/auth/register", payload, {
    skipAuth: true,
  });
}

export async function loginCustomer(
  payload: LoginPayload,
): Promise<PasswordLoginResult> {
  return apiPost<PasswordLoginResult>("/storefront/auth/login", payload, {
    skipAuth: true,
  });
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
    payload,
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

export async function confirmEmailVerification(email: string, code: string) {
  return apiPost<{ success: boolean }>(
    "/storefront/auth/verify-email/confirm",
    { email, code },
    { skipAuth: true },
  );
}

export async function requestPhoneVerification(phone: string) {
  return apiPost<{ success: boolean; message: string }>(
    "/storefront/auth/verify-phone/request",
    { phone },
    { skipAuth: true },
  );
}

export async function confirmPhoneVerification(phone: string, code: string) {
  return apiPost<{ success: boolean }>(
    "/storefront/auth/verify-phone/confirm",
    { phone, code },
    { skipAuth: true },
  );
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
