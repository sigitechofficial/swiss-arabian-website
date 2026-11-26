/** Storefront auth types — Swagger is source of truth. */

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

/** Where a mobile code goes. */
export type PhoneCodeChannel = "SMS" | "WHATSAPP";

/**
 * Sign-up: nothing is created until the code sent to the email AND the code sent
 * to the mobile are entered (`register/confirm`).
 */
export type RegisterPayload = {
  zoneCode: string;
  email: string;
  phone: string;
  phoneChannel?: PhoneCodeChannel;
  password: string;
  firstName?: string;
  lastName?: string;
  salesChannelCode?: string;
  marketingConsent?: boolean;
  smsConsent?: boolean;
};

/** `register` / `register/resend` / an unfinished `register/confirm`. */
export type SignupPending = {
  status: "VERIFICATION_REQUIRED";
  signupId: string;
  email: string;
  /** Last two digits of the mobile, for "we sent a code to …12". */
  phoneHint: string;
  phoneChannel: PhoneCodeChannel;
  emailConfirmed: boolean;
  phoneConfirmed: boolean;
  /** The email belongs to a record we already have: "we found your account". */
  existingAccount: boolean;
};

export type SignupCompleted = AuthResult & {
  status: "AUTHENTICATED";
  claimedExistingAccount: boolean;
};

export type SignupConfirmResult = SignupPending | SignupCompleted;

export function isSignupCompleted(result: SignupConfirmResult): result is SignupCompleted {
  return result.status === "AUTHENTICATED";
}

/** Tokens come back only when sign-in was asked for and the backend supports it. */
export type EmailVerificationConfirmResult = { success: boolean } & Partial<AuthResult>;

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

export function isAuthResult(data: PasswordLoginResult): data is AuthResult {
  return "token" in data && Boolean(data.token);
}

export function isEmailVerificationRequired(
  data: PasswordLoginResult,
): data is EmailVerificationRequired {
  return "status" in data && data.status === "EMAIL_VERIFICATION_REQUIRED";
}
