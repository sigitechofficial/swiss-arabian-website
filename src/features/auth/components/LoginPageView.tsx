"use client";

import { LocaleLink } from "@/lib/i18n/LocaleLink";
import { maskEmail, useLoginFlow } from "../hooks/useAuthForms";
import { AuthShell } from "./AuthShell";
import {
  AuthDivider,
  AuthField,
  AuthPasswordField,
  AuthSocialButtons,
  AuthSubmitButton,
} from "./AuthFormControls";
import { AuthOtpField } from "./AuthOtpField";

const linkButtonClass =
  "mt-4 cursor-pointer text-center text-[12.5px] font-normal text-sa-primary underline underline-offset-2 hover:text-terra";

export function LoginPageView() {
  const {
    step,
    marketDialCode,
    oauthEnabled,
    codeSignInEnabled,
    form,
    emailForm,
    codeForm,
    codeValue,
    setCode,
    resendSeconds,
    submitPassword,
    submitCodeRequest,
    submitCode,
    onResend,
    switchToEmailCode,
    switchToPassword,
  } = useLoginFlow();

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
        <form
          className="flex w-full flex-col"
          onSubmit={submitPassword}
        >
          {oauthEnabled ? (
            <>
              <AuthSocialButtons />
              <AuthDivider />
            </>
          ) : null}
          <div className="flex w-full flex-col gap-4">
            <AuthField
              id="identifier"
              label="Email or phone"
              placeholder={`you@example.com or +${marketDialCode}…`}
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
          {codeSignInEnabled ? (
            <button
              type="button"
              className={linkButtonClass}
              onClick={switchToEmailCode}
            >
              Email me a one-time sign-in code instead
            </button>
          ) : null}
          <AuthFooterLinks />
        </form>
      ) : null}

      {step.kind === "email-code-request" ? (
        <form
          className="flex w-full flex-col"
          onSubmit={submitCodeRequest}
        >
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
              {emailForm.formState.isSubmitting
                ? "Sending…"
                : "Email me a code"}
            </AuthSubmitButton>
          </div>
          <button
            type="button"
            className={linkButtonClass}
            onClick={() => switchToPassword()}
          >
            Sign in with password instead
          </button>
          <AuthFooterLinks />
        </form>
      ) : null}

      {step.kind === "email-code-confirm" ? (
        <form
          className="flex w-full flex-col gap-5"
          onSubmit={submitCode}
        >
          <AuthOtpField
            id="login-code"
            label="Sign-in code"
            autoFocus
            value={codeValue}
            onChange={setCode}
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
        <LocaleLink
          className="font-medium text-terra hover:text-[var(--sa-action-primary-hover)]"
          href="/register"
        >
          Create an account
        </LocaleLink>
      </p>
      <p className="mt-4 text-center text-[11px] font-normal leading-relaxed text-sa-muted">
        By continuing you agree to Swiss Arabian&apos;s Terms &amp; Conditions
        and Privacy Policy.
      </p>
    </>
  );
}
