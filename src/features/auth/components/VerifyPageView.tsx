"use client";

import { LocaleLink } from "@/lib/i18n/LocaleLink";
import { formErrorText } from "@/lib/i18n/formErrors";
import { useShopCopy } from "@/lib/i18n/useShopCopy";
import { useVerifyForm } from "../hooks/useAuthForms";
import { AuthShell } from "./AuthShell";
import { AuthSubmitButton } from "./AuthFormControls";
import { AuthOtpField } from "./AuthOtpField";

export function VerifyPageView() {
  const { enabled, email, form, codeValue, setCode, submit, resending, onResend } = useVerifyForm();
  const t = useShopCopy();

  if (!enabled) {
    return (
      <AuthShell heading={t("auth.verify.disabledHeading")} subtitle={t("auth.verify.disabled")}>
        <p className="text-center text-[12.5px] font-normal text-sa-secondary">
          <LocaleLink className="font-medium text-terra" href="/login">
            {t("auth.backToSignIn")}
          </LocaleLink>
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      heading={t("auth.verify.heading")}
      subtitle={email ? t("auth.verify.subtitle", { email }) : t("auth.verify.subtitleNoEmail")}
    >
      <form className="flex w-full flex-col gap-5" onSubmit={submit}>
        <AuthOtpField
          id="code"
          label={t("auth.verify.code")}
          autoFocus
          value={codeValue}
          onChange={setCode}
          error={formErrorText(t, form.formState.errors.code?.message)}
        />
        <AuthSubmitButton disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? t("auth.verify.verifying") : t("auth.verify.submit")}
        </AuthSubmitButton>
        <p className="text-center text-[12.5px] font-normal text-sa-secondary">
          {t("auth.verify.noCode")}{" "}
          <button
            type="button"
            className="font-medium text-terra disabled:opacity-60"
            onClick={onResend}
            disabled={resending || !email}
          >
            {resending ? t("auth.sending") : t("auth.verify.resend")}
          </button>
        </p>
      </form>
    </AuthShell>
  );
}
