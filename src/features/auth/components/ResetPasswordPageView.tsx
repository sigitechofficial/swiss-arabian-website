"use client";

import { LocaleLink } from "@/lib/i18n/LocaleLink";
import { useResetPasswordForm } from "../hooks/useAuthForms";
import { AuthShell } from "./AuthShell";
import { AuthField, AuthPasswordField, AuthSubmitButton } from "./AuthFormControls";
import { AuthOtpField } from "./AuthOtpField";

export function ResetPasswordPageView() {
  const { form, codeValue, setCode, submit } = useResetPasswordForm();

  return (
    <AuthShell heading="Reset password" subtitle="Enter the code we sent you and choose a new password.">
      <form className="flex w-full flex-col gap-4" onSubmit={submit}>
        <AuthField
          id="identifier"
          label="Email or phone"
          placeholder="you@email.com"
          autoComplete="username"
          {...form.register("identifier")}
          error={form.formState.errors.identifier?.message}
        />
        <AuthOtpField
          id="code"
          label="Reset code"
          value={codeValue}
          onChange={setCode}
          error={form.formState.errors.code?.message}
        />
        <AuthPasswordField
          id="newPassword"
          label="New password"
          autoComplete="new-password"
          placeholder="Your new password"
          {...form.register("newPassword")}
          error={form.formState.errors.newPassword?.message}
        />
        <div className="pt-1">
          <AuthSubmitButton disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Updating…" : "Update password"}
          </AuthSubmitButton>
        </div>
        <p className="text-center text-[12.5px] font-normal text-sa-secondary">
          <LocaleLink className="font-medium text-[var(--sa-action-primary)]" href="/login">
            Back to sign in
          </LocaleLink>
        </p>
      </form>
    </AuthShell>
  );
}
