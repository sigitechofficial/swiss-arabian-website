"use client";

import { LocaleLink } from "@/lib/i18n/LocaleLink";
import { formErrorText } from "@/lib/i18n/formErrors";
import { useShopCopy } from "@/lib/i18n/useShopCopy";
import { useResetPasswordForm } from "../hooks/useAuthForms";
import { AuthShell } from "./AuthShell";
import { AuthField, AuthPasswordField, AuthSubmitButton } from "./AuthFormControls";
import { AuthOtpField } from "./AuthOtpField";

export function ResetPasswordPageView() {
  const { form, codeValue, setCode, submit } = useResetPasswordForm();
  const t = useShopCopy();

  return (
    <AuthShell heading={t("auth.reset.heading")} subtitle={t("auth.reset.subtitle")}>
      <form className="flex w-full flex-col gap-4" onSubmit={submit}>
        <AuthField
          id="identifier"
          label={t("auth.emailOrPhone")}
          placeholder={t("auth.emailPlaceholder")}
          autoComplete="username"
          {...form.register("identifier")}
          error={formErrorText(t, form.formState.errors.identifier?.message)}
        />
        <AuthOtpField
          id="code"
          label={t("auth.reset.code")}
          value={codeValue}
          onChange={setCode}
          error={formErrorText(t, form.formState.errors.code?.message)}
        />
        <AuthPasswordField
          id="newPassword"
          label={t("account.security.new")}
          autoComplete="new-password"
          placeholder={t("auth.reset.newPlaceholder")}
          {...form.register("newPassword")}
          error={formErrorText(t, form.formState.errors.newPassword?.message)}
        />
        <div className="pt-1">
          <AuthSubmitButton disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? t("account.security.updating") : t("account.security.update")}
          </AuthSubmitButton>
        </div>
        <p className="text-center text-[12.5px] font-normal text-sa-secondary">
          <LocaleLink className="font-medium text-[var(--sa-action-primary)]" href="/login">
            {t("auth.backToSignIn")}
          </LocaleLink>
        </p>
      </form>
    </AuthShell>
  );
}
