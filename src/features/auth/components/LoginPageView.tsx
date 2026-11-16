"use client";

import { LocaleLink } from "@/lib/i18n/LocaleLink";
import { formErrorText } from "@/lib/i18n/formErrors";
import { useShopCopy } from "@/lib/i18n/useShopCopy";
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
  const t = useShopCopy();

  const heading =
    step.kind === "email-code-confirm"
      ? t("auth.login.codeHeading")
      : step.kind === "email-code-request"
        ? t("auth.login.requestHeading")
        : t("account.welcomeBack");

  const subtitle =
    step.kind === "email-code-confirm"
      ? t("auth.login.codeSubtitle", { email: maskEmail(step.email) })
      : step.kind === "email-code-request"
        ? t("auth.login.requestSubtitle")
        : t("auth.login.subtitle");

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
              label={t("auth.emailOrPhone")}
              placeholder={t("auth.identifierPlaceholder", { dial: marketDialCode })}
              autoComplete="username"
              {...form.register("identifier")}
              error={formErrorText(t, form.formState.errors.identifier?.message)}
            />
            <AuthPasswordField
              id="password"
              label={t("account.password")}
              autoComplete="current-password"
              placeholder={t("auth.passwordPlaceholder")}
              {...form.register("password")}
              error={formErrorText(t, form.formState.errors.password?.message)}
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
              <span>{t("auth.remember")}</span>
            </label>
            <LocaleLink
              className="shrink-0 text-[12.5px] font-normal text-sa-primary underline underline-offset-2 hover:text-terra"
              href="/forgot-password"
            >
              {t("auth.forgotLink")}
            </LocaleLink>
          </div>
          <div className="pt-5">
            <AuthSubmitButton disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? t("auth.signingIn") : t("auth.signIn")}
            </AuthSubmitButton>
          </div>
          {codeSignInEnabled ? (
            <button
              type="button"
              className={linkButtonClass}
              onClick={switchToEmailCode}
            >
              {t("auth.login.codeInstead")}
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
            label={t("email")}
            placeholder="you@example.com"
            autoComplete="email"
            inputMode="email"
            {...emailForm.register("email")}
            error={formErrorText(t, emailForm.formState.errors.email?.message)}
          />
          <div className="pt-5">
            <AuthSubmitButton disabled={emailForm.formState.isSubmitting}>
              {emailForm.formState.isSubmitting
                ? t("auth.sending")
                : t("auth.login.emailCode")}
            </AuthSubmitButton>
          </div>
          <button
            type="button"
            className={linkButtonClass}
            onClick={() => switchToPassword()}
          >
            {t("auth.login.passwordInstead")}
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
            label={t("auth.login.code")}
            autoFocus
            value={codeValue}
            onChange={setCode}
            error={formErrorText(t, codeForm.formState.errors.code?.message)}
          />
          <AuthSubmitButton disabled={codeForm.formState.isSubmitting}>
            {codeForm.formState.isSubmitting ? t("auth.signingIn") : t("auth.signIn")}
          </AuthSubmitButton>
          <p className="flex flex-wrap items-center justify-center gap-1 text-[12.5px] font-normal text-sa-secondary">
            <span>{t("auth.login.noCode")}</span>
            {resendSeconds > 0 ? (
              <span className="font-medium text-terra">
                {t("auth.resendIn", { seconds: String(resendSeconds).padStart(2, "0") })}
              </span>
            ) : (
              <button
                type="button"
                className="font-medium text-terra hover:underline"
                onClick={() => void onResend()}
              >
                {t("auth.resendCode")}
              </button>
            )}
          </p>
          <button
            type="button"
            className="cursor-pointer text-center text-[12.5px] font-normal text-sa-primary underline underline-offset-2 hover:text-terra"
            onClick={() => switchToPassword(step.email)}
          >
            {t("auth.login.backToPassword")}
          </button>
        </form>
      ) : null}
    </AuthShell>
  );
}

function AuthFooterLinks() {
  const t = useShopCopy();
  return (
    <>
      <p className="mt-6 text-center text-[13px] font-normal text-sa-secondary">
        {t("auth.newTo")}{" "}
        <LocaleLink
          className="font-medium text-terra hover:text-[var(--sa-action-primary-hover)]"
          href="/register"
        >
          {t("auth.createAccount")}
        </LocaleLink>
      </p>
      <p className="mt-4 text-center text-[11px] font-normal leading-relaxed text-sa-muted">
        {t("auth.terms")}
      </p>
    </>
  );
}
