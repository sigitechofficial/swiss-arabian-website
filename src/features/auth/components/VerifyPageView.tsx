"use client";

import { LocaleLink } from "@/lib/i18n/LocaleLink";
import { useVerifyForm } from "../hooks/useAuthForms";
import { AuthShell } from "./AuthShell";
import { AuthSubmitButton } from "./AuthFormControls";
import { AuthOtpField } from "./AuthOtpField";

export function VerifyPageView() {
  const { enabled, email, form, codeValue, setCode, submit, resending, onResend } = useVerifyForm();

  if (!enabled) {
    return (
      <AuthShell heading="Verification" subtitle="Verification is currently disabled.">
        <p className="text-center text-[12.5px] font-normal text-sa-secondary">
          <LocaleLink className="font-medium text-terra" href="/login">
            Back to sign in
          </LocaleLink>
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      heading="Verify your account"
      subtitle={email ? `Enter the code we sent to ${email}.` : "Enter the verification code you received."}
    >
      <form className="flex w-full flex-col gap-5" onSubmit={submit}>
        <AuthOtpField
          id="code"
          label="Verification code"
          autoFocus
          value={codeValue}
          onChange={setCode}
          error={form.formState.errors.code?.message}
        />
        <AuthSubmitButton disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Verifying…" : "Verify"}
        </AuthSubmitButton>
        <p className="text-center text-[12.5px] font-normal text-sa-secondary">
          Didn&apos;t get a code?{" "}
          <button
            type="button"
            className="font-medium text-terra disabled:opacity-60"
            onClick={onResend}
            disabled={resending || !email}
          >
            {resending ? "Sending…" : "Resend"}
          </button>
        </p>
      </form>
    </AuthShell>
  );
}
