"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { z } from "zod";
import { toast } from "@/components/ui/Toaster";
import { env } from "@/lib/config/env";
import { getUserFacingErrorMessage } from "@/lib/api/userFacingErrors";
import {
  confirmEmailLoginCode,
  confirmEmailVerification,
  loginCustomer,
  requestEmailLoginCode,
  resendOtp,
  toLoginIdentifier,
} from "../api/auth.service";
import { applyAuthResult } from "../lib/applyAuthSession";
import { loginSchema, type LoginFormValues } from "../schemas/loginSchema";
import { verifySchema, type VerifyFormValues } from "../schemas/verifySchema";
import {
  isAuthResult,
  isEmailVerificationRequired,
} from "../types/auth";
import { AuthCard } from "./AuthCard";
import { AuthCheckbox } from "./AuthCheckbox";
import { AuthField } from "./AuthField";
import { AuthOtpInput } from "./AuthOtpInput";
import { AuthPasswordField } from "./AuthPasswordField";
import { AuthOrDivider, AuthSocialButtons } from "./AuthSocialButtons";
import { AuthSubmitButton } from "./AuthSubmitButton";

const emailOnlySchema = z.object({
  identifier: z
    .string()
    .min(1, "Enter your email")
    .refine((value) => z.email().safeParse(value.trim()).success, {
      message: "Enter a valid email address",
    }),
});

type EmailOnlyValues = z.infer<typeof emailOnlySchema>;

type LoginStep =
  | { kind: "password" }
  | { kind: "email-code-request" }
  | { kind: "email-code-confirm"; email: string }
  | { kind: "verify-email"; email: string; password: string };

const RESEND_SECONDS = 30;

function maskEmail(email: string) {
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}${"•".repeat(Math.max(local.length - 2, 1))}@${domain}`;
}

export function LoginPageView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo") || "/account";
  const [step, setStep] = useState<LoginStep>({ kind: "password" });
  const [resendSeconds, setResendSeconds] = useState(0);

  const passwordForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { remember: false },
  });

  const emailCodeForm = useForm<EmailOnlyValues>({
    resolver: zodResolver(emailOnlySchema),
    defaultValues: { identifier: "" },
  });

  const otpForm = useForm<VerifyFormValues>({
    resolver: zodResolver(verifySchema),
    defaultValues: { code: env.masterOtp || "" },
  });

  useEffect(() => {
    if (resendSeconds <= 0) return;
    const id = window.setTimeout(
      () => setResendSeconds((s) => s - 1),
      1000,
    );
    return () => window.clearTimeout(id);
  }, [resendSeconds]);

  function finishLogin() {
    toast("Welcome back", "success");
    router.push(returnTo.startsWith("/") ? returnTo : "/account");
  }

  function switchToEmailCode() {
    const current = passwordForm.getValues("identifier");
    if (current) emailCodeForm.setValue("identifier", current);
    setStep({ kind: "email-code-request" });
    otpForm.reset({ code: env.masterOtp || "" });
  }

  function switchToPassword() {
    if (
      step.kind === "email-code-request" ||
      step.kind === "email-code-confirm"
    ) {
      const current =
        step.kind === "email-code-confirm"
          ? step.email
          : emailCodeForm.getValues("identifier");
      if (current) passwordForm.setValue("identifier", current);
    }
    setStep({ kind: "password" });
    otpForm.reset({ code: env.masterOtp || "" });
  }

  async function handleResend() {
    if (resendSeconds > 0) return;
    try {
      if (step.kind === "verify-email") {
        await resendOtp(step.email, "VERIFY_EMAIL");
      } else if (step.kind === "email-code-confirm") {
        await resendOtp(step.email, "LOGIN");
      } else {
        return;
      }
      setResendSeconds(RESEND_SECONDS);
      toast("Code sent", "success");
    } catch (error) {
      toast(getUserFacingErrorMessage(error), "error");
    }
  }

  const isOtpStep =
    step.kind === "verify-email" || step.kind === "email-code-confirm";

  const title =
    step.kind === "verify-email"
      ? "Verify your email"
      : step.kind === "email-code-confirm"
        ? "Enter your code"
        : "Welcome back";

  const subtitle =
    step.kind === "verify-email"
      ? `We sent a code to ${maskEmail(step.email)}. Verify to continue signing in.`
      : step.kind === "email-code-confirm"
        ? `Enter the code we emailed to ${maskEmail(step.email)}.`
        : step.kind === "email-code-request"
          ? "We'll email you a one-time code to sign in."
          : "Sign in to your account to purchase and check out.";

  return (
    <AuthCard title={title} subtitle={subtitle}>
      {step.kind === "password" ? (
        <form
          className="flex w-full flex-col"
          onSubmit={passwordForm.handleSubmit(async (values) => {
            try {
              const identifier = toLoginIdentifier(values.identifier);
              const result = await loginCustomer({
                identifier,
                password: values.password,
              });

              if (isEmailVerificationRequired(result)) {
                setStep({
                  kind: "verify-email",
                  email: result.email,
                  password: values.password,
                });
                otpForm.reset({ code: env.masterOtp || "" });
                setResendSeconds(RESEND_SECONDS);
                toast("Check your email for a verification code", "info");
                return;
              }

              if (!isAuthResult(result)) {
                toast("Unexpected login response. Please try again.", "error");
                return;
              }

              applyAuthResult(result);
              finishLogin();
            } catch (error) {
              toast(getUserFacingErrorMessage(error), "error");
            }
          })}
        >
          <AuthSocialButtons />
          <AuthOrDivider />

          <div className="flex w-full flex-col gap-4">
            <AuthField
              label="Email or phone"
              placeholder="you@example.com or +971…"
              autoComplete="username"
              {...passwordForm.register("identifier")}
              error={passwordForm.formState.errors.identifier?.message}
            />
            <AuthPasswordField
              placeholder="Your password"
              {...passwordForm.register("password")}
              error={passwordForm.formState.errors.password?.message}
            />
          </div>

          <div className="flex items-center justify-between gap-3 pb-1 pt-3">
            <AuthCheckbox
              label="Remember me"
              {...passwordForm.register("remember")}
            />
            <Link
              href="/forgot-password"
              className="shrink-0 text-[14px] font-medium text-sa-primary underline underline-offset-2 hover:text-terra"
            >
              Forgot password?
            </Link>
          </div>

          <div className="pt-5">
            <AuthSubmitButton disabled={passwordForm.formState.isSubmitting}>
              Sign in
            </AuthSubmitButton>
          </div>

          <button
            type="button"
            onClick={switchToEmailCode}
            className="mt-4 cursor-pointer text-center text-[14px] font-medium text-sa-primary underline underline-offset-2 hover:text-terra"
          >
            Email me a one-time sign-in code instead
          </button>

          <AuthFooterLinks />
        </form>
      ) : null}

      {step.kind === "email-code-request" ? (
        <form
          className="flex w-full flex-col"
          onSubmit={emailCodeForm.handleSubmit(async (values) => {
            try {
              const email = values.identifier.trim();
              await requestEmailLoginCode(email);
              setStep({ kind: "email-code-confirm", email });
              otpForm.reset({ code: env.masterOtp || "" });
              setResendSeconds(RESEND_SECONDS);
              toast(
                "If an account exists for this email, a code has been sent.",
                "success",
              );
            } catch (error) {
              toast(getUserFacingErrorMessage(error), "error");
            }
          })}
        >
          <AuthField
            label="Email address"
            placeholder="you@example.com"
            autoComplete="email"
            {...emailCodeForm.register("identifier")}
            error={emailCodeForm.formState.errors.identifier?.message}
          />

          <div className="pt-5">
            <AuthSubmitButton disabled={emailCodeForm.formState.isSubmitting}>
              Email me a code
            </AuthSubmitButton>
          </div>

          <button
            type="button"
            onClick={switchToPassword}
            className="mt-4 cursor-pointer text-center text-[14px] font-medium text-sa-primary underline underline-offset-2 hover:text-terra"
          >
            Sign in with password instead
          </button>

          <AuthFooterLinks />
        </form>
      ) : null}

      {isOtpStep ? (
        <form
          className="flex w-full flex-col gap-5"
          onSubmit={otpForm.handleSubmit(async (values) => {
            try {
              if (step.kind === "verify-email") {
                await confirmEmailVerification(step.email, values.code);
                const result = await loginCustomer({
                  identifier: step.email,
                  password: step.password,
                });
                if (isEmailVerificationRequired(result)) {
                  toast(
                    "Email still unverified. Request a new code and try again.",
                    "error",
                  );
                  return;
                }
                if (!isAuthResult(result)) {
                  toast("Unexpected login response. Please try again.", "error");
                  return;
                }
                applyAuthResult(result);
                finishLogin();
                return;
              }

              if (step.kind === "email-code-confirm") {
                const result = await confirmEmailLoginCode({
                  email: step.email,
                  code: values.code,
                });
                applyAuthResult(result);
                finishLogin();
              }
            } catch (error) {
              toast(getUserFacingErrorMessage(error), "error");
            }
          })}
        >
          <Controller
            name="code"
            control={otpForm.control}
            render={({ field }) => (
              <AuthOtpInput
                value={field.value}
                onChange={field.onChange}
                error={otpForm.formState.errors.code?.message}
              />
            )}
          />

          {env.masterOtp ? (
            <p className="text-center text-[12px] text-sa-muted">
              Local QA: master OTP is available when the backend flag is on.
            </p>
          ) : null}

          <AuthSubmitButton disabled={otpForm.formState.isSubmitting}>
            {step.kind === "verify-email" ? "Verify & sign in" : "Sign in"}
          </AuthSubmitButton>

          <p className="flex flex-wrap items-center justify-center gap-1 text-[13px]">
            <span className="text-sa-secondary">Didn&apos;t receive it?</span>
            {resendSeconds > 0 ? (
              <span className="font-semibold text-terra">
                Resend in 0:{String(resendSeconds).padStart(2, "0")}
              </span>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                className="font-semibold text-terra hover:underline"
              >
                Resend code
              </button>
            )}
          </p>

          <button
            type="button"
            onClick={switchToPassword}
            className="cursor-pointer text-center text-[14px] font-medium text-sa-primary underline underline-offset-2 hover:text-terra"
          >
            Back to password sign in
          </button>
        </form>
      ) : null}
    </AuthCard>
  );
}

function AuthFooterLinks() {
  return (
    <>
      <p className="mt-6 text-center text-[15px] text-sa-secondary">
        New to Swiss Arabian?{" "}
        <Link
          href="/register"
          className="font-medium text-terra hover:text-[var(--sa-action-primary-hover)]"
        >
          Create an account
        </Link>
      </p>
      <p className="mt-4 text-center text-[12px] leading-relaxed text-sa-muted">
        By continuing you agree to Swiss Arabian&apos;s Terms &amp; Conditions
        and Privacy Policy.
      </p>
    </>
  );
}
