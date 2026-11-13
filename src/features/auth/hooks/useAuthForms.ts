"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocaleRouter } from "@/lib/i18n/useLocaleRouter";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { getCountryCallingCode, type CountryCode } from "libphonenumber-js";
import { toast } from "@/components/ui/Toaster";
import { toastApiError } from "@/lib/api/toastApiError";
import { refreshCustomerScopedCaches } from "@/lib/auth/sessionCache";
import { env } from "@/lib/config/env";
import { useShopCopy } from "@/lib/i18n/useShopCopy";
import { resolveStorefrontContext, toAuthZoneCode } from "@/lib/storefront/context";
import { useMarket } from "@/providers/MarketProvider";
import { useUiStore } from "@/stores/useUiStore";
import {
  confirmEmailLoginCode,
  confirmEmailVerification,
  forgotPassword,
  loginCustomer,
  registerCustomer,
  requestEmailLoginCode,
  requestEmailVerification,
  resendOtp,
  resetPassword,
  splitFullName,
  toLoginIdentifier,
} from "../api/auth.service";
import { applyAuthResult } from "../lib/applyAuthSession";
import { confirmStoredPhoneWithSameCode } from "../lib/confirmStoredPhone";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  type ForgotPasswordFormValues,
  type LoginFormValues,
  type RegisterFormValues,
  type ResetPasswordFormValues,
} from "../schemas/auth.schema";
import { isAuthResult, isEmailVerificationRequired } from "../types/auth";
import { markNewAccount } from "../utils/newAccountGreeting";
import { clearResetIdentifier, readResetIdentifier, storeResetIdentifier } from "../utils/resetIdentifier";
import { safeReturnPath } from "../utils/safeReturnPath";

/**
 * Auth form logic shared by every brand. Each hook reports what happened as a
 * notice code and API failures as errors; by default both become Swiss
 * Arabian's toasts, and a brand can pass its own handlers to show them inline.
 */
export type AuthNotice =
  | "codeSent"
  | "codeResent"
  | "signedIn"
  | "emailVerifiedSignedIn"
  | "emailVerifiedSignIn"
  | "resetCodeSent"
  | "passwordUpdated"
  | "chooseCountry";

export type AuthFeedback = {
  onNotice?: (notice: AuthNotice) => void;
  onError?: (error: unknown) => void;
};

const DEFAULT_NOTICES: Record<Exclude<AuthNotice, "chooseCountry">, string> = {
  codeSent: "If an account exists for this email, a code is on its way.",
  codeResent: "Code sent — check your email.",
  signedIn: "Signed in.",
  emailVerifiedSignedIn: "Email verified. You’re signed in.",
  emailVerifiedSignIn: "Email verified. Please sign in.",
  resetCodeSent: "If an account exists, a reset code has been sent.",
  passwordUpdated: "Password updated. Please sign in.",
};

function useFeedback(feedback: AuthFeedback = {}) {
  const copy = useShopCopy();
  return {
    notice: (notice: AuthNotice) => {
      if (feedback.onNotice) return feedback.onNotice(notice);
      if (notice === "chooseCountry") return toast(copy("chooseCountry"), "error");
      toast(DEFAULT_NOTICES[notice], "success");
    },
    error: (error: unknown) => (feedback.onError ? feedback.onError(error) : toastApiError(error)),
  };
}

/** `?returnTo=` when it is a path on this site, else the account page. */
function useReturnTo(fallbackWhenMissing = "/account") {
  const searchParams = useSearchParams();
  return safeReturnPath(searchParams.get("returnTo"), fallbackWhenMissing);
}

/** Seconds before "Resend code" becomes available again. */
export const RESEND_SECONDS = 30;

const emailOnlySchema = z.object({
  email: z.string().trim().min(1, "Enter your email").email("Enter a valid email address"),
});
type EmailOnlyValues = z.infer<typeof emailOnlySchema>;

const codeSchema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Enter the 6-digit code we emailed you"),
});
type CodeValues = z.infer<typeof codeSchema>;

/** `aisha@example.com` → `ai•••@example.com` — shown back, never the full address. */
export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}${"•".repeat(Math.max(local.length - 2, 1))}@${domain}`;
}

export type LoginStep =
  | { kind: "password" }
  | { kind: "email-code-request" }
  | { kind: "email-code-confirm"; email: string };

/** The selected market's dial code (+974 in Qatar), for the phone hint. */
export function useMarketDialCode(): string {
  const marketCountry = useMarket().catalogContext?.countryCode?.toUpperCase() || "AE";
  try {
    return getCountryCallingCode(marketCountry as CountryCode);
  } catch {
    return "971";
  }
}

/**
 * Sign in: password, or a one-time code by email (request → enter code →
 * signed in) when verification is on. Unverified accounts go to /verify.
 */
export function useLoginFlow(feedback?: AuthFeedback) {
  const router = useLocaleRouter();
  const say = useFeedback(feedback);
  const marketDialCode = useMarketDialCode();
  const searchParams = useSearchParams();
  const returnTo = safeReturnPath(searchParams.get("returnTo"));
  const [step, setStep] = useState<LoginStep>({ kind: "password" });
  const [resendSeconds, setResendSeconds] = useState(0);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: "", password: "", remember: false },
  });
  const emailForm = useForm<EmailOnlyValues>({
    resolver: zodResolver(emailOnlySchema),
    defaultValues: { email: "" },
  });
  const codeForm = useForm<CodeValues>({
    resolver: zodResolver(codeSchema),
    defaultValues: { code: "" },
  });
  const codeValue = useWatch({ control: codeForm.control, name: "code" });

  useEffect(() => {
    if (resendSeconds <= 0) return;
    const id = window.setTimeout(() => setResendSeconds((seconds) => seconds - 1), 1000);
    return () => window.clearTimeout(id);
  }, [resendSeconds]);

  function finishLogin() {
    router.push(returnTo);
  }

  async function onSubmit(values: LoginFormValues) {
    try {
      const result = await loginCustomer({
        identifier: toLoginIdentifier(values.identifier),
        password: values.password,
      });
      if (isEmailVerificationRequired(result)) {
        const query = new URLSearchParams({
          email: result.email,
          returnTo,
        });
        router.push(`/verify?${query.toString()}`);
        return;
      }
      if (isAuthResult(result)) {
        applyAuthResult(result);
        finishLogin();
      }
    } catch (error) {
      say.error(error);
    }
  }

  /** Carry whatever email was already typed into the code flow, and back again. */
  function switchToEmailCode() {
    const typed = form.getValues("identifier").trim();
    if (typed.includes("@")) emailForm.setValue("email", typed);
    codeForm.reset({ code: "" });
    setStep({ kind: "email-code-request" });
  }

  function switchToPassword(email?: string) {
    if (email) form.setValue("identifier", email);
    codeForm.reset({ code: "" });
    setStep({ kind: "password" });
  }

  async function onRequestCode(values: EmailOnlyValues) {
    const email = values.email.trim();
    try {
      await requestEmailLoginCode(email);
      codeForm.reset({ code: "" });
      setResendSeconds(RESEND_SECONDS);
      setStep({ kind: "email-code-confirm", email });
      // Deliberately vague — never reveal whether an account exists.
      say.notice("codeSent");
    } catch (error) {
      say.error(error);
    }
  }

  async function onConfirmCode(values: CodeValues) {
    if (step.kind !== "email-code-confirm") return;
    try {
      const result = await confirmEmailLoginCode({ email: step.email, code: values.code.trim() });
      applyAuthResult(result);
      say.notice("signedIn");
      finishLogin();
    } catch (error) {
      say.error(error);
    }
  }

  async function onResend() {
    if (step.kind !== "email-code-confirm" || resendSeconds > 0) return;
    try {
      await resendOtp(step.email, "LOGIN");
      setResendSeconds(RESEND_SECONDS);
      say.notice("codeResent");
    } catch (error) {
      say.error(error);
    }
  }

  return {
    step,
    marketDialCode,
    oauthEnabled: env.flags.oauth,
    codeSignInEnabled: env.flags.verification,
    form,
    emailForm,
    codeForm,
    codeValue,
    setCode: (code: string) => codeForm.setValue("code", code, { shouldValidate: true, shouldDirty: true }),
    resendSeconds,
    submitPassword: form.handleSubmit(onSubmit),
    submitCodeRequest: emailForm.handleSubmit(onRequestCode),
    submitCode: codeForm.handleSubmit(onConfirmCode),
    onResend,
    switchToEmailCode,
    switchToPassword,
  };
}

/** Create an account in the selected market; with verification on, the emailed code finishes it. */
export function useRegisterForm(feedback?: AuthFeedback) {
  const router = useLocaleRouter();
  const say = useFeedback(feedback);
  const returnTo = useReturnTo();
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: "", email: "", phone: "", password: "" },
  });

  async function onSubmit(values: RegisterFormValues) {
    try {
      const { firstName, lastName } = splitFullName(values.fullName);
      const saved = useUiStore.getState();
      const zoneCode = toAuthZoneCode(saved.catalogContext?.zoneCode || saved.selectedMarketId);
      if (!zoneCode) {
        say.notice("chooseCountry");
        return;
      }
      const context = resolveStorefrontContext({ zoneCode });
      const result = await registerCustomer({
        zoneCode: context.zoneCode || zoneCode,
        salesChannelCode: context.salesChannelCode || undefined,
        email: values.email,
        // Already E.164 from the phone field.
        phone: values.phone,
        password: values.password,
        firstName,
        lastName,
        // Without the code screen there is nowhere to finish, so only ask when it is on.
        verifyEmailFirst: env.flags.verification,
      });
      // The first dashboard visit says "Welcome", not "Welcome back".
      markNewAccount(values.email);
      if (isEmailVerificationRequired(result)) {
        // The account exists; the emailed code finishes the sign-up and signs in.
        const query = new URLSearchParams({ email: result.email, returnTo });
        router.push(`/verify?${query.toString()}`);
        return;
      }
      if (isAuthResult(result)) {
        applyAuthResult(result);
        router.push(returnTo);
      }
    } catch (error) {
      say.error(error);
    }
  }

  return { form, oauthEnabled: env.flags.oauth, submit: form.handleSubmit(onSubmit) };
}

const verifySchema = z.object({
  code: z.string().regex(/^\d{6}$/, "Enter the 6-digit code we sent you"),
});
type VerifyFormValues = z.infer<typeof verifySchema>;

/** Confirm an email (a valid code also signs in) or finish a code sign-in (`?mode=login-code`). */
export function useVerifyForm(feedback?: AuthFeedback) {
  const router = useLocaleRouter();
  const say = useFeedback(feedback);
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const isLoginCode = searchParams.get("mode") === "login-code";
  const returnTo = useReturnTo();
  const [resending, setResending] = useState(false);
  const form = useForm<VerifyFormValues>({
    resolver: zodResolver(verifySchema),
    defaultValues: { code: "" },
  });
  const codeValue = useWatch({ control: form.control, name: "code" });

  async function onSubmit(values: VerifyFormValues) {
    try {
      if (isLoginCode) {
        const result = await confirmEmailLoginCode({ email, code: values.code });
        applyAuthResult(result);
        say.notice("signedIn");
        router.push(returnTo);
        return;
      }
      // A valid code also signs in, so nobody types the password twice.
      const result = await confirmEmailVerification(email, values.code, { signIn: true });
      if (result.token && result.customer) {
        applyAuthResult({ token: result.token, customer: result.customer });
        try {
          await confirmStoredPhoneWithSameCode({ phoneE164: result.customer.phoneE164, code: values.code });
        } catch {
          // Email ownership is already confirmed. Phone proof is optional here.
        }
        refreshCustomerScopedCaches();
        say.notice("emailVerifiedSignedIn");
        router.push(returnTo);
        return;
      }
      // A backend that only verifies: finish with a normal sign-in.
      say.notice("emailVerifiedSignIn");
      router.push(`/login?returnTo=${encodeURIComponent(returnTo)}`);
    } catch (error) {
      say.error(error);
    }
  }

  async function onResend() {
    if (!email) return;
    setResending(true);
    try {
      if (isLoginCode) await requestEmailLoginCode(email);
      else await requestEmailVerification(email);
      say.notice("codeResent");
    } catch (error) {
      say.error(error);
    } finally {
      setResending(false);
    }
  }

  return {
    enabled: env.flags.verification,
    email,
    form,
    codeValue,
    setCode: (code: string) => form.setValue("code", code, { shouldValidate: true, shouldDirty: true }),
    submit: form.handleSubmit(onSubmit),
    resending,
    onResend,
  };
}

/** Ask for a reset code; the reset page opens with the identifier filled in. */
export function useForgotPasswordForm(feedback?: AuthFeedback) {
  const router = useLocaleRouter();
  const say = useFeedback(feedback);
  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { identifier: "" },
  });

  async function onSubmit(values: ForgotPasswordFormValues) {
    try {
      await forgotPassword(toLoginIdentifier(values.identifier));
      say.notice("resetCodeSent");
      // Kept out of the address (history, analytics, referrers): the reset page reads it from this tab.
      storeResetIdentifier(values.identifier);
      router.push("/reset-password");
    } catch (error) {
      say.error(error);
    }
  }

  return { form, submit: form.handleSubmit(onSubmit) };
}

/** Set a new password with the emailed reset code, then sign in again. */
export function useResetPasswordForm(feedback?: AuthFeedback) {
  const router = useLocaleRouter();
  const say = useFeedback(feedback);
  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { identifier: "", code: "", newPassword: "" },
  });
  const codeValue = useWatch({ control: form.control, name: "code" });
  // The identifier from "forgot password" (this tab's session storage), filled
  // in after hydration unless the shopper already typed one.
  useEffect(() => {
    const stored = readResetIdentifier();
    if (stored && !form.getValues("identifier")) form.setValue("identifier", stored);
  }, [form]);

  async function onSubmit(values: ResetPasswordFormValues) {
    try {
      await resetPassword({
        identifier: toLoginIdentifier(values.identifier),
        code: values.code,
        newPassword: values.newPassword,
      });
      clearResetIdentifier();
      say.notice("passwordUpdated");
      router.push("/login");
    } catch (error) {
      say.error(error);
    }
  }

  return {
    form,
    codeValue,
    setCode: (code: string) => form.setValue("code", code, { shouldValidate: true, shouldDirty: true }),
    submit: form.handleSubmit(onSubmit),
  };
}
