"use client";

import { LocaleLink } from "@/lib/i18n/LocaleLink";
import { formErrorText } from "@/lib/i18n/formErrors";
import { useShopCopy } from "@/lib/i18n/useShopCopy";
import { Controller } from "react-hook-form";
import { useRegisterForm } from "../hooks/useAuthForms";
import { AuthShell } from "./AuthShell";
import { PhoneNumberField } from "@/components/ui/PhoneNumberField";
import { AuthDivider, AuthField, AuthPasswordField, AuthSocialButtons, AuthSubmitButton } from "./AuthFormControls";

export function RegisterPageView() {
  const { form, oauthEnabled, submit } = useRegisterForm();
  const t = useShopCopy();

  return (
    <AuthShell heading={t("auth.createAccount")} subtitle={t("auth.register.subtitle")}>
      <form className="flex w-full flex-col" onSubmit={submit}>
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
