"use client";

import { LocaleLink } from "@/lib/i18n/LocaleLink";
import { useForgotPasswordForm } from "../hooks/useAuthForms";
import { AuthShell } from "./AuthShell";
import { AuthField, AuthSubmitButton } from "./AuthFormControls";

export function ForgotPasswordPageView() {
  const { form, submit } = useForgotPasswordForm();

  return (
    <AuthShell heading="Forgot password" subtitle="We’ll send a one-time code if the account exists.">
      <form className="flex w-full flex-col gap-5" onSubmit={submit}>
        <AuthField
          id="identifier"
          label="Email or phone"
          placeholder="you@email.com"
          autoComplete="username"
          {...form.register("identifier")}
          error={form.formState.errors.identifier?.message}
        />
        <AuthSubmitButton disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Sending…" : "Send reset code"}
        </AuthSubmitButton>
        <p className="text-center text-[12.5px] font-normal text-sa-secondary">
          <LocaleLink className="font-medium text-[var(--sa-action-primary)]" href="/login">
            Back to sign in
          </LocaleLink>
        </p>
      </form>
    </AuthShell>
  );
}
