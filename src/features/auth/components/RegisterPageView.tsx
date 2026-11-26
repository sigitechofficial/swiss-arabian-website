"use client";

import { LocaleLink } from "@/lib/i18n/LocaleLink";
import { formErrorText } from "@/lib/i18n/formErrors";
import { useShopCopy } from "@/lib/i18n/useShopCopy";
import { Controller } from "react-hook-form";
import { useRegisterForm } from "../hooks/useAuthForms";
import { AuthShell } from "./AuthShell";
import { AuthCheckbox } from "./AuthCheckbox";
import { AuthOtpField } from "./AuthOtpField";
import { PhoneNumberField } from "@/components/ui/PhoneNumberField";
import { AuthDivider, AuthField, AuthPasswordField, AuthSocialButtons, AuthSubmitButton } from "./AuthFormControls";

const linkButtonClass = "font-medium text-terra disabled:opacity-60";

/** Sign-up: the details, then the code sent to the email and the code sent to the mobile. */
export function RegisterPageView() {
  const register = useRegisterForm();
  const { form, oauthEnabled, submit, step } = register;
  const t = useShopCopy();

  if (step.kind === "codes") {
    const { pending } = step;
    const errors = register.codesForm.formState.errors;
    const busy = register.codesForm.formState.isSubmitting;
    return (
      <AuthShell
        heading={t("auth.register.codesHeading")}
        subtitle={t(pending.existingAccount ? "auth.register.accountFoundSubtitle" : "auth.register.codesSubtitle", {
          email: pending.email,
          digits: pending.phoneHint,
        })}
      >
        <form className="flex w-full flex-col gap-5" onSubmit={register.submitCodes} noValidate>
          {pending.emailConfirmed ? (
            <p className="text-[13px] text-sa-secondary">{t("auth.register.emailConfirmed")}</p>
          ) : (
            <AuthOtpField
              id="signup-email-code"
              label={t("auth.register.emailCode")}
              autoFocus
              value={register.emailCode}
              onChange={register.setEmailCode}
              error={formErrorText(t, errors.emailCode?.message)}
            />
          )}
          {pending.phoneConfirmed ? (
            <p className="text-[13px] text-sa-secondary">{t("auth.register.phoneConfirmed")}</p>
          ) : (
            <AuthOtpField
              id="signup-phone-code"
              label={t("auth.register.phoneCode")}
              value={register.phoneCode}
              onChange={register.setPhoneCode}
              error={formErrorText(t, errors.phoneCode?.message)}
            />
          )}
          <AuthSubmitButton disabled={busy}>
            {busy ? t("auth.register.confirming") : t("auth.register.confirm")}
          </AuthSubmitButton>
          {register.resendSeconds > 0 ? (
            <p className="text-center text-[12.5px] text-sa-secondary" aria-live="polite">
              {t("auth.resendIn", { seconds: String(register.resendSeconds).padStart(2, "0") })}
            </p>
          ) : (
            <div className="flex flex-col items-center gap-2 text-[12.5px]">
              {!pending.emailConfirmed ? (
                <button type="button" className={linkButtonClass} onClick={() => void register.resend("EMAIL")}>
                  {t("auth.register.resendEmail")}
                </button>
              ) : null}
              {!pending.phoneConfirmed ? (
                <>
                  <button type="button" className={linkButtonClass} onClick={() => void register.resend("PHONE", "SMS")}>
                    {t("auth.register.resendSms")}
                  </button>
                  <button
                    type="button"
                    className={linkButtonClass}
                    onClick={() => void register.resend("PHONE", "WHATSAPP")}
                  >
                    {t("auth.register.resendWhatsApp")}
                  </button>
                </>
              ) : null}
            </div>
          )}
          <button type="button" className="text-[12.5px] text-sa-secondary underline" onClick={register.startOver}>
            {t("auth.register.startOver")}
          </button>
        </form>
      </AuthShell>
    );
  }

  return (
    <AuthShell heading={t("auth.createAccount")} subtitle={t("auth.register.subtitle")}>
      <form className="flex w-full flex-col" onSubmit={submit} noValidate>
        {oauthEnabled ? (
          <>
            <AuthSocialButtons />
            <AuthDivider />
          </>
        ) : null}
        <div className="flex w-full flex-col gap-4">
          <AuthField
            id="fullName"
            label={t("auth.fullName")}
            placeholder={t("auth.fullNamePlaceholder")}
            autoComplete="name"
            {...form.register("fullName")}
            error={formErrorText(t, form.formState.errors.fullName?.message)}
          />
          <AuthField
            id="email"
            label={t("email")}
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            {...form.register("email")}
            error={formErrorText(t, form.formState.errors.email?.message)}
          />
          <Controller
            name="phone"
            control={form.control}
            render={({ field }) => (
              <PhoneNumberField
                id="mobile"
                value={field.value ?? ""}
                onChange={field.onChange}
                onBlur={field.onBlur}
                hint={t("auth.register.phoneHint")}
                error={formErrorText(t, form.formState.errors.phone?.message)}
              />
            )}
          />
          <AuthPasswordField
            id="password"
            label={t("account.password")}
            autoComplete="new-password"
            placeholder={t("auth.passwordPlaceholder")}
            {...form.register("password")}
            error={formErrorText(t, form.formState.errors.password?.message)}
          />
          <AuthCheckbox
            id="marketingConsent"
            label={t("auth.register.marketingConsent")}
            {...form.register("marketingConsent")}
          />
          <AuthCheckbox id="smsConsent" label={t("auth.register.smsConsent")} {...form.register("smsConsent")} />
        </div>
        <div className="pt-5">
          <AuthSubmitButton disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? t("auth.register.creating") : t("auth.register.create")}
          </AuthSubmitButton>
        </div>
        <p className="mt-6 text-center text-[13px] font-normal text-sa-secondary">
          {t("auth.register.already")}{" "}
          <LocaleLink className="font-medium text-terra hover:text-[var(--sa-action-primary-hover)]" href="/login">
            {t("auth.signIn")}
          </LocaleLink>
        </p>
        <p className="mt-4 text-center text-[11px] font-normal leading-relaxed text-sa-muted">
          {t("auth.terms")}
        </p>
      </form>
    </AuthShell>
  );
}
