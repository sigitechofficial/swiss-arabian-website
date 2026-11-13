"use client";

import { Controller } from "react-hook-form";
import {
  useForgotPasswordForm,
  useLoginFlow,
  useMarketDialCode,
  useRegisterForm,
  useResetPasswordForm,
  useVerifyForm,
  maskEmail,
} from "@/features/auth/hooks/useAuthForms";
import { getBrand } from "@/lib/brand";
import { Button, Checkbox, Field } from "../../ui";
import { buttonClass } from "../../ui/Button";
import { cx } from "../../ui/shared";
import { useSapilCopy } from "../../i18n/SapilCopy";
import { SapilLink, richText } from "../../components/commerce/shared";
import { FormCard, FormMessage } from "../../components/account/FormCard";
import { CodeField, PasswordField, useAuthMessages } from "../../components/account/AuthFields";
import { SapilPhoneField } from "../../components/commerce/SapilPhoneField";

function Terms() {
  const t = useSapilCopy();
  const legal = getBrand().legal;
  return (
    <p className="mt-[18px] text-center text-[12px] text-sapil-muted">
      {richText(t("account.authTerms"), {
        terms: (
          <SapilLink href={legal.terms} className="underline">
            {t("account.authTermsLink")}
          </SapilLink>
        ),
        privacy: (
          <SapilLink href={legal.privacy} className="underline">
            {t("account.authPrivacyLink")}
          </SapilLink>
        ),
      })}
    </p>
  );
}

const linkButton = cx(buttonClass("link"), "!text-[14px] self-center");

/** `/login`: password sign-in, or a one-time code by email. */
export function SapilLoginForm() {
  const t = useSapilCopy();
  const messages = useAuthMessages();
  const flow = useLoginFlow(messages.feedback);
  const { step } = flow;
  const errors = flow.form.formState.errors;

  if (step.kind === "email-code-request") {
    return (
      <FormCard eyebrow={t("account.loginEyebrow")} title={t("account.loginCodeTitle")} accent={t("account.loginCodeAccent")} lede={t("account.loginCodeLede")}>
        {messages.message ? <FormMessage tone={messages.message.tone}>{messages.message.text}</FormMessage> : null}
        <form onSubmit={flow.submitCodeRequest} noValidate className="flex flex-col gap-[14px]">
          <Field
            id="code-email"
            type="email"
            autoComplete="email"
            inputMode="email"
            label={t("account.authEmail")}
            placeholder={t("account.authEmailPlaceholder")}
            {...flow.emailForm.register("email")}
            error={flow.emailForm.formState.errors.email ? t("account.authErrEmail") : undefined}
          />
          <Button type="submit" className="w-full mt-[6px]" disabled={flow.emailForm.formState.isSubmitting}>
            {flow.emailForm.formState.isSubmitting ? t("account.loginCodeSending") : t("account.loginCodeSend")}
          </Button>
          <button type="button" className={linkButton} onClick={() => flow.switchToPassword()}>
            {t("account.loginPasswordInstead")}
          </button>
        </form>
      </FormCard>
    );
  }

  if (step.kind === "email-code-confirm") {
    return (
      <FormCard
        eyebrow={t("account.loginEyebrow")}
        title={t("account.loginConfirmTitle")}
        accent={t("account.loginConfirmAccent")}
        lede={t("account.loginConfirmLede", { email: maskEmail(step.email) })}
      >
        {messages.message ? <FormMessage tone={messages.message.tone}>{messages.message.text}</FormMessage> : null}
        <form onSubmit={flow.submitCode} noValidate className="flex flex-col gap-[14px]">
          <CodeField
            id="login-code"
            autoFocus
            label={t("account.authCode")}
            value={flow.codeValue}
            onChange={(event) => flow.setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
            error={flow.codeForm.formState.errors.code ? t("account.authErrCode") : undefined}
          />
          <Button type="submit" className="w-full mt-[6px]" disabled={flow.codeForm.formState.isSubmitting}>
            {flow.codeForm.formState.isSubmitting ? t("account.loginSubmitting") : t("account.loginSubmit")}
          </Button>
          <p className="text-center text-[14px] text-sapil-ink-2">
            {t("account.loginNoCode")}{" "}
            {flow.resendSeconds > 0 ? (
              <span className="font-[600]" aria-live="polite">
                {t("account.loginResendIn", { seconds: String(flow.resendSeconds).padStart(2, "0") })}
              </span>
            ) : (
              <button type="button" className={cx(buttonClass("link"), "!text-[14px]")} onClick={() => void flow.onResend()}>
                {t("account.loginResend")}
              </button>
            )}
          </p>
          <button type="button" className={linkButton} onClick={() => flow.switchToPassword(step.email)}>
            {t("account.loginBackToPassword")}
          </button>
        </form>
      </FormCard>
    );
  }

  return (
    <FormCard
      eyebrow={t("account.loginEyebrow")}
      title={t("account.loginTitle")}
      accent={t("account.loginAccent")}
      lede={t("account.loginLede")}
      footer={
        <>
          {t("account.loginNew")}{" "}
          <SapilLink href="/register" className={cx(buttonClass("link"), "!text-[14px]")}>
            {t("account.loginCreate")}
          </SapilLink>
        </>
      }
    >
      {messages.message ? <FormMessage tone={messages.message.tone}>{messages.message.text}</FormMessage> : null}
      <form onSubmit={flow.submitPassword} noValidate className="flex flex-col gap-[14px]">
        <Field
          id="identifier"
          autoComplete="username"
          label={t("account.authEmailOrPhone")}
          placeholder={t("account.authEmailOrPhonePlaceholder", { dial: flow.marketDialCode })}
          {...flow.form.register("identifier")}
          error={errors.identifier ? t("account.authErrIdentifier") : undefined}
        />
        <PasswordField
          id="password"
          autoComplete="current-password"
          label={t("account.authPassword")}
          placeholder={t("account.authPasswordPlaceholder")}
          {...flow.form.register("password")}
          error={errors.password ? t("account.authErrPassword") : undefined}
        />
        <div className="flex items-center justify-between gap-[12px]">
          <Checkbox className="!mt-0" {...flow.form.register("remember")}>
            {t("account.loginRemember")}
          </Checkbox>
          <SapilLink href="/forgot-password" className={cx(buttonClass("link"), "!text-[14px]")}>
            {t("account.loginForgot")}
          </SapilLink>
        </div>
        <Button type="submit" className="w-full mt-[6px]" disabled={flow.form.formState.isSubmitting}>
          {flow.form.formState.isSubmitting ? t("account.loginSubmitting") : t("account.loginSubmit")}
        </Button>
        {flow.codeSignInEnabled ? (
          <button type="button" className={linkButton} onClick={flow.switchToEmailCode}>
            {t("account.loginCodeInstead")}
          </button>
        ) : null}
      </form>
      <Terms />
    </FormCard>
  );
}

/** `/register`: create an account in the selected market. */
export function SapilRegisterForm() {
  const t = useSapilCopy();
  const messages = useAuthMessages();
  const { form, submit } = useRegisterForm(messages.feedback);
  const dialCode = useMarketDialCode();
  const errors = form.formState.errors;
  return (
    <FormCard
      eyebrow={t("account.registerEyebrow")}
      title={t("account.registerTitle")}
      accent={t("account.registerAccent")}
      lede={t("account.registerLede")}
      footer={
        <>
          {t("account.registerHave")}{" "}
          <SapilLink href="/login" className={cx(buttonClass("link"), "!text-[14px]")}>
            {t("account.registerSignIn")}
          </SapilLink>
        </>
      }
    >
      {messages.message ? <FormMessage tone={messages.message.tone}>{messages.message.text}</FormMessage> : null}
      <form onSubmit={submit} noValidate className="flex flex-col gap-[14px]">
        <Field
          id="fullName"
          autoComplete="name"
          label={t("account.authFullName")}
          placeholder={t("account.authFullNamePlaceholder")}
          {...form.register("fullName")}
          error={errors.fullName ? t("account.authErrFullName") : undefined}
        />
        <Field
          id="email"
          type="email"
          autoComplete="email"
          label={t("account.authEmail")}
          placeholder={t("account.authEmailPlaceholder")}
          {...form.register("email")}
          error={errors.email ? t("account.authErrEmail") : undefined}
        />
        <Controller
          name="phone"
          control={form.control}
          render={({ field }) => (
            <SapilPhoneField
              id="mobile"
              autoComplete="tel-national"
              label={t("account.authMobile")}
              placeholder={t("account.authMobilePlaceholder")}
              dialCode={dialCode}
              value={field.value ?? ""}
              onChange={field.onChange}
              error={errors.phone ? t("account.authErrMobile") : undefined}
            />
          )}
        />
        <PasswordField
          id="password"
          autoComplete="new-password"
          label={t("account.authPassword")}
          placeholder={t("account.authNewPasswordPlaceholder")}
          {...form.register("password")}
          error={errors.password ? t("account.authErrNewPassword") : undefined}
        />
        <Button type="submit" className="w-full mt-[6px]" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? t("account.registerSubmitting") : t("account.registerSubmit")}
        </Button>
      </form>
      <Terms />
    </FormCard>
  );
}

/** `/verify`: the emailed code confirms the email (and signs in) or finishes a code sign-in. */
export function SapilVerifyForm() {
  const t = useSapilCopy();
  const messages = useAuthMessages();
  const verify = useVerifyForm(messages.feedback);
  const back = (
    <SapilLink href="/login" className={cx(buttonClass("link"), "!text-[14px]")}>
      {t("account.backToSignIn")}
    </SapilLink>
  );
  if (!verify.enabled) {
    return (
      <FormCard title={t("account.verifyTitle")} accent={t("account.verifyAccent")} lede={t("account.verifyDisabled")}>
        <p className="text-center">{back}</p>
      </FormCard>
    );
  }
  return (
    <FormCard
      eyebrow={t("account.verifyEyebrow")}
      title={t("account.verifyTitle")}
      accent={t("account.verifyAccent")}
      lede={verify.email ? t("account.verifyLede", { email: verify.email }) : t("account.verifyLedeNoEmail")}
      footer={back}
    >
      {messages.message ? <FormMessage tone={messages.message.tone}>{messages.message.text}</FormMessage> : null}
      <form onSubmit={verify.submit} noValidate className="flex flex-col gap-[14px]">
        <CodeField
          id="code"
          autoFocus
          label={t("account.authCode")}
          value={verify.codeValue}
          onChange={(event) => verify.setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
          error={verify.form.formState.errors.code ? t("account.authErrCode") : undefined}
        />
        <Button type="submit" className="w-full mt-[6px]" disabled={verify.form.formState.isSubmitting}>
          {verify.form.formState.isSubmitting ? t("account.verifySubmitting") : t("account.verifySubmit")}
        </Button>
        <button type="button" className={linkButton} onClick={() => void verify.onResend()} disabled={verify.resending || !verify.email}>
          {verify.resending ? t("account.verifyResending") : t("account.verifyResend")}
        </button>
      </form>
    </FormCard>
  );
}

/** `/forgot-password`: request a reset code. */
export function SapilForgotPasswordForm() {
  const t = useSapilCopy();
  const messages = useAuthMessages();
  const { form, submit } = useForgotPasswordForm(messages.feedback);
  const error = form.formState.errors.identifier;
  return (
    <FormCard
      eyebrow={t("account.forgotEyebrow")}
      title={t("account.forgotTitle")}
      accent={t("account.forgotAccent")}
      lede={t("account.forgotLede")}
      footer={
        <SapilLink href="/login" className={cx(buttonClass("link"), "!text-[14px]")}>
          {t("account.backToSignIn")}
        </SapilLink>
      }
    >
      {messages.message ? <FormMessage tone={messages.message.tone}>{messages.message.text}</FormMessage> : null}
      <form onSubmit={submit} noValidate className="flex flex-col gap-[14px]">
        <Field
          id="identifier"
          autoComplete="username"
          label={t("account.authEmailOrPhone")}
          placeholder={t("account.authEmailPlaceholder")}
          {...form.register("identifier")}
          error={error ? (error.type === "too_small" ? t("account.authErrIdentifier") : t("account.authErrIdentifierInvalid")) : undefined}
        />
        <Button type="submit" className="w-full mt-[6px]" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? t("account.forgotSubmitting") : t("account.forgotSubmit")}
        </Button>
      </form>
    </FormCard>
  );
}

/** `/reset-password`: the emailed code and a new password. */
export function SapilResetPasswordForm() {
  const t = useSapilCopy();
  const messages = useAuthMessages();
  const reset = useResetPasswordForm(messages.feedback);
  const errors = reset.form.formState.errors;
  return (
    <FormCard
      eyebrow={t("account.resetEyebrow")}
      title={t("account.resetTitle")}
      accent={t("account.resetAccent")}
      lede={t("account.resetLede")}
      footer={
        <SapilLink href="/login" className={cx(buttonClass("link"), "!text-[14px]")}>
          {t("account.backToSignIn")}
        </SapilLink>
      }
    >
      {messages.message ? <FormMessage tone={messages.message.tone}>{messages.message.text}</FormMessage> : null}
      <form onSubmit={reset.submit} noValidate className="flex flex-col gap-[14px]">
        <Field
          id="identifier"
          autoComplete="username"
          label={t("account.authEmailOrPhone")}
          placeholder={t("account.authEmailPlaceholder")}
          {...reset.form.register("identifier")}
          error={errors.identifier ? t("account.authErrIdentifier") : undefined}
        />
        <CodeField
          id="code"
          label={t("account.authCode")}
          value={reset.codeValue}
          onChange={(event) => reset.setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
          error={errors.code ? t("account.authErrCode") : undefined}
        />
        <PasswordField
          id="newPassword"
          autoComplete="new-password"
          label={t("account.authNewPassword")}
          placeholder={t("account.authNewPasswordPlaceholder")}
          {...reset.form.register("newPassword")}
          error={errors.newPassword ? t("account.authErrNewPassword") : undefined}
        />
        <Button type="submit" className="w-full mt-[6px]" disabled={reset.form.formState.isSubmitting}>
          {reset.form.formState.isSubmitting ? t("account.resetSubmitting") : t("account.resetSubmit")}
        </Button>
      </form>
    </FormCard>
  );
}
