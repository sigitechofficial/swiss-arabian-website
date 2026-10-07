"use client";

import { LocaleLink } from "@/lib/i18n/LocaleLink";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toastApiError } from "@/lib/api/toastApiError";
import { toast } from "@/components/ui/Toaster";
import { env } from "@/lib/config/env";
import {
  confirmEmailLoginCode,
  loginCustomer,
  requestEmailLoginCode,
  resendOtp,
  toLoginIdentifier,
} from "../api/auth.service";
import { applyAuthResult } from "../lib/applyAuthSession";
import { isAuthResult, isEmailVerificationRequired } from "../types/auth";
import { loginSchema, type LoginFormValues } from "../schemas/auth.schema";
import { AuthShell } from "./AuthShell";
import { AuthDivider, AuthField, AuthPasswordField, AuthSocialButtons, AuthSubmitButton } from "./AuthFormControls";
import { AuthOtpField } from "./AuthOtpField";

/** Seconds before "Resend code" becomes available again. */
const RESEND_SECONDS = 30;

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
function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}${"•".repeat(Math.max(local.length - 2, 1))}@${domain}`;
}

type LoginStep =
  | { kind: "password" }
  | { kind: "email-code-request" }
  | { kind: "email-code-confirm"; email: string };

const linkButtonClass =
  "mt-4 cursor-pointer text-center text-[12.5px] font-normal text-sa-primary underline underline-offset-2 hover:text-terra";

export function LoginPageView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo") || "/account";
  // The one-time-code flow stays on this page: request → enter code → signed in.
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

  useEffect(() => {
    if (resendSeconds <= 0) return;
    const id = window.setTimeout(() => setResendSeconds((seconds) => seconds - 1), 1000);
    return () => window.clearTimeout(id);
  }, [resendSeconds]);

  function finishLogin() {
    router.push(returnTo.startsWith("/") ? returnTo : "/account");
  }

  async function onSubmit(values: LoginFormValues) {
    try {
      const result = await loginCustomer({
        identifier: toLoginIdentifier(values.identifier),
        password: values.password,
      });
      if (isEmailVerificationRequired(result)) {
        router.push(`/verify?email=${encodeURIComponent(result.email)}`);
        return;
      }
      if (isAuthResult(result)) {
        applyAuthResult(result);
        finishLogin();
      }
    } catch (error) {
      toastApiError(error);
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
      toast("If an account exists for this email, a code is on its way.", "success");
    } catch (error) {
      toastApiError(error);
    }
  }

  async function onConfirmCode(values: CodeValues) {
    if (step.kind !== "email-code-confirm") return;
    try {
      const result = await confirmEmailLoginCode({ email: step.email, code: values.code.trim() });
      applyAuthResult(result);
      toast("Signed in.", "success");
      finishLogin();
    } catch (error) {
      toastApiError(error);
    }
  }

  async function onResend() {
    if (step.kind !== "email-code-confirm" || resendSeconds > 0) return;
    try {
      await resendOtp(step.email, "LOGIN");
      setResendSeconds(RESEND_SECONDS);
      toast("Code sent — check your email.", "success");
    } catch (error) {
      toastApiError(error);
    }
  }

  const heading =
    step.kind === "email-code-confirm"
      ? "Enter your code"
      : step.kind === "email-code-request"
        ? "Sign in with a code"
        : "Welcome back";

  const subtitle =
    step.kind === "email-code-confirm"
      ? `Enter the code we emailed to ${maskEmail(step.email)}.`
      : step.kind === "email-code-request"
        ? "We’ll email you a one-time code — no password needed."
        : "Sign in to your account to purchase and check out.";

  return (
    <AuthShell heading={heading} subtitle={subtitle}>
      {step.kind === "password" ? (
        <form className="flex w-full flex-col" onSubmit={form.handleSubmit(onSubmit)}>
          {env.flags.oauth ? (
            <>
              <AuthSocialButtons />
              <AuthDivider />
            </>
          ) : null}
          <div className="flex w-full flex-col gap-4">
            <AuthField
              id="identifier"
              label="Email or phone"
              placeholder="you@example.com or +971…"
              autoComplete="username"
              {...form.register("identifier")}
              error={form.formState.errors.identifier?.message}
            />
            <AuthPasswordField
              id="password"
              label="Password"
              autoComplete="current-password"
              placeholder="Your password"
              {...form.register("password")}
              error={form.formState.errors.password?.message}
            />
          </div>
          <div className="flex items-center justify-between gap-3 pb-1 pt-3">
            <label
              htmlFor="remember"
              className="flex cursor-pointer items-center gap-2 text-[12.5px] font-normal text-sa-secondary"
            >
              <input
                id="remember"
                type="checkbox"
                className="size-[16px] shrink-0 cursor-pointer appearance-none rounded border border-sa-input bg-surface bg-center bg-no-repeat checked:border-terra checked:bg-terra checked:bg-[length:12px_12px] checked:bg-[url('data:image/svg+xml,%3Csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20viewBox=%270%200%2016%2016%27%20fill=%27none%27%3E%3Cpath%20d=%27M3.5%208.5L6.5%2011.5L12.5%204.5%27%20stroke=%27%23fff%27%20stroke-width=%271.8%27%20stroke-linecap=%27round%27%20stroke-linejoin=%27round%27/%3E%3C/svg%3E')] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terra"
                {...form.register("remember")}
              />
              <span>Remember me</span>
            </label>
            <LocaleLink
              className="shrink-0 text-[12.5px] font-normal text-sa-primary underline underline-offset-2 hover:text-terra"
              href="/forgot-password"
            >
              Forgot password?
            </LocaleLink>
          </div>
          <div className="pt-5">
            <AuthSubmitButton disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Signing in…" : "Sign in"}
            </AuthSubmitButton>
          </div>
          {env.flags.verification ? (
            <button type="button" className={linkButtonClass} onClick={switchToEmailCode}>
              Email me a one-time sign-in code instead
            </button>
          ) : null}
          <AuthFooterLinks />
        </form>
      ) : null}

      {step.kind === "email-code-request" ? (
        <form className="flex w-full flex-col" onSubmit={emailForm.handleSubmit(onRequestCode)}>
          <AuthField
            id="code-email"
            label="Email address"
            placeholder="you@example.com"
            autoComplete="email"
            inputMode="email"
            {...emailForm.register("email")}
            error={emailForm.formState.errors.email?.message}
          />
          <div className="pt-5">
            <AuthSubmitButton disabled={emailForm.formState.isSubmitting}>
              {emailForm.formState.isSubmitting ? "Sending…" : "Email me a code"}
            </AuthSubmitButton>
          </div>
          <button type="button" className={linkButtonClass} onClick={() => switchToPassword()}>
            Sign in with password instead
          </button>
          <AuthFooterLinks />
        </form>
      ) : null}

      {step.kind === "email-code-confirm" ? (
        <form className="flex w-full flex-col gap-5" onSubmit={codeForm.handleSubmit(onConfirmCode)}>
          <AuthOtpField
            id="login-code"
            label="Sign-in code"
            autoFocus
            value={codeForm.watch("code")}
            onChange={(code) => codeForm.setValue("code", code, { shouldValidate: true, shouldDirty: true })}
            error={codeForm.formState.errors.code?.message}
          />
          <AuthSubmitButton disabled={codeForm.formState.isSubmitting}>
            {codeForm.formState.isSubmitting ? "Signing in…" : "Sign in"}
          </AuthSubmitButton>
          <p className="flex flex-wrap items-center justify-center gap-1 text-[12.5px] font-normal text-sa-secondary">
            <span>Didn&apos;t receive it?</span>
            {resendSeconds > 0 ? (
              <span className="font-medium text-terra">
                Resend in 0:{String(resendSeconds).padStart(2, "0")}
              </span>
            ) : (
              <button
                type="button"
                className="font-medium text-terra hover:underline"
                onClick={() => void onResend()}
              >
                Resend code
              </button>
            )}
          </p>
          <button
            type="button"
            className="cursor-pointer text-center text-[12.5px] font-normal text-sa-primary underline underline-offset-2 hover:text-terra"
            onClick={() => switchToPassword(step.email)}
          >
            Back to password sign in
          </button>
        </form>
      ) : null}
    </AuthShell>
  );
}

function AuthFooterLinks() {
  return (
    <>
      <p className="mt-6 text-center text-[13px] font-normal text-sa-secondary">
        New to Swiss Arabian?{" "}
        <LocaleLink className="font-medium text-terra hover:text-[var(--sa-action-primary-hover)]" href="/register">
          Create an account
        </LocaleLink>
      </p>
      <p className="mt-4 text-center text-[11px] font-normal leading-relaxed text-sa-muted">
        By continuing you agree to Swiss Arabian&apos;s Terms &amp; Conditions and Privacy Policy.
      </p>
    </>
  );
}
