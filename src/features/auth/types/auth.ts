/** Phase 1 storefront auth types — Swagger is source of truth. */

export type IssuedCustomerToken = {
  accessToken: string;
  tokenType: "Bearer";
  expiresIn: number;
  sessionId: string;
  refreshToken: string;
  refreshExpiresIn: number;
};

export type CustomerProfileView = {
  id: string;
  email: string | null;
  phoneE164: string | null;
  firstName: string | null;
  lastName: string | null;
  fullName: string | null;
  zoneId: string | null;
  isEmailVerified: boolean;
};

export type AuthResult = {
  token: IssuedCustomerToken;
  customer: CustomerProfileView;
};

/** Password login when email is unverified (HTTP 200 — not an error). */
export type EmailVerificationRequired = {
  status: "EMAIL_VERIFICATION_REQUIRED";
  email: string;
};

export type PasswordLoginResult = AuthResult | EmailVerificationRequired;

export type EmailLoginCodeConfirmPayload = {
  email: string;
  code: string;
  guestToken?: string;
};

export type RegisterPayload = {
  zoneCode: string;
  email?: string;
  phone?: string;
  password: string;
  firstName?: string;
  lastName?: string;
  salesChannelCode?: string;
  /** Maps to Insider `gdpr_optin` on backend user_register upsert. */
  marketingConsent?: boolean;
  /** Maps to Insider `sms_optin` on backend user_register upsert. */
  smsConsent?: boolean;
};

export type LoginPayload = {
  identifier: string;
  password: string;
  guestToken?: string;
};

export type CustomerSessionView = {
  id: string;
  ipAddress: string | null;
  userAgent: string | null;
  deviceName: string | null;
  browser: string | null;
  os: string | null;
  city: string | null;
  countryCode: string | null;
  issuedAt: string;
  lastSeenAt: string | null;
  expiresAt: string;
  current: boolean;
};

export type OtpPurpose =
  | "VERIFY_EMAIL"
  | "VERIFY_PHONE"
  | "RESET_PASSWORD"
  | "LOGIN";

export function isAuthResult(
  data: PasswordLoginResult,
): data is AuthResult {
  return "token" in data && Boolean(data.token);
}

export function isEmailVerificationRequired(
  data: PasswordLoginResult,
): data is EmailVerificationRequired {
  return (
    "status" in data && data.status === "EMAIL_VERIFICATION_REQUIRED"
  );
}
