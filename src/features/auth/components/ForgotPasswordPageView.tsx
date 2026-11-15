"use client";

import { LocaleLink } from "@/lib/i18n/LocaleLink";
import { formErrorText } from "@/lib/i18n/formErrors";
import { useShopCopy } from "@/lib/i18n/useShopCopy";
import { useForgotPasswordForm } from "../hooks/useAuthForms";
import { AuthShell } from "./AuthShell";
import { AuthField, AuthSubmitButton } from "./AuthFormControls";

export function ForgotPasswordPageView() {
  const { form, submit } = useForgotPasswordForm();
  const t = useShopCopy();

  return (
    <AuthShell heading={t("auth.forgot.heading")} subtitle={t("auth.forgot.subtitle")}>
      <form className="flex w-full flex-col gap-5" onSubmit={submit}>
        <AuthField
          id="identifier"
          label={t("auth.emailOrPhone")}
          placeholder={t("auth.emailPlaceholder")}
          autoComplete="username"
          {...form.register("identifier")}
          error={formErrorText(t, form.formState.errors.identifier?.message)}
        />
        <AuthSubmitButton disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? t("auth.sending") : t("auth.forgot.send")}
        </AuthSubmitButton>
        <p className="text-center text-[12.5px] font-normal text-sa-secondary">
          <LocaleLink className="font-medium text-[var(--sa-action-primary)]" href="/login">
            {t("auth.backToSignIn")}
          </LocaleLink>
        </p>
      </form>
    </AuthShell>
  );
}
