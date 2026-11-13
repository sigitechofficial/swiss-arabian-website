"use client";

import { forwardRef, useState, type InputHTMLAttributes, type ReactNode } from "react";
import { getUserFacingErrorMessage } from "@/lib/api/userFacingErrors";
import type { AuthNotice } from "@/features/auth/hooks/useAuthForms";
import { Field } from "../../ui";
import { buttonClass } from "../../ui/Button";
import { cx } from "../../ui/shared";
import { useSapilCopy } from "../../i18n/SapilCopy";
import type { SapilCopyKey } from "../../i18n/catalog";

type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "className" | "prefix">;

/** Password field with a show / hide toggle on the label row. */
export const PasswordField = forwardRef<
  HTMLInputElement,
  InputProps & { id: string; label: ReactNode; error?: ReactNode }
>(function PasswordField({ id, label, error, ...input }, ref) {
  const t = useSapilCopy();
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <Field ref={ref} {...input} id={id} label={label} type={visible ? "text" : "password"} error={error} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-controls={id}
        aria-pressed={visible}
        className={cx(buttonClass("link"), "absolute top-0 end-0 !text-[13px] !pb-0")}
      >
        {visible ? t("account.hidePassword") : t("account.showPassword")}
      </button>
    </div>
  );
});

/** One-time code input (6 digits). */
export const CodeField = forwardRef<HTMLInputElement, InputProps & { id: string; label: ReactNode; error?: ReactNode }>(
  function CodeField({ id, label, error, ...input }, ref) {
    return (
      <Field
        ref={ref}
        {...input}
        id={id}
        label={label}
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        dir="ltr"
        inputClassName="tracking-[.3em] text-center !text-[18px]"
        error={error}
      />
    );
  },
);

const NOTICE_KEYS: Record<Exclude<AuthNotice, "chooseCountry">, SapilCopyKey> = {
  codeSent: "account.noticeCodeSent",
  codeResent: "account.noticeCodeResent",
  signedIn: "account.noticeSignedIn",
  emailVerifiedSignedIn: "account.noticeEmailVerifiedSignedIn",
  emailVerifiedSignIn: "account.noticeEmailVerifiedSignIn",
  resetCodeSent: "account.noticeResetCodeSent",
  passwordUpdated: "account.noticePasswordUpdated",
};

/** Auth hook feedback shown inline (announced) instead of toasts. */
export function useAuthMessages() {
  const t = useSapilCopy();
  const [message, setMessage] = useState<{ tone: "error" | "ok"; text: string } | null>(null);
  return {
    message,
    clear: () => setMessage(null),
    feedback: {
      onNotice: (notice: AuthNotice) =>
        setMessage(
          notice === "chooseCountry"
            ? { tone: "error", text: t("account.authErrCountry") }
            : { tone: "ok", text: t(NOTICE_KEYS[notice]) },
        ),
      onError: (error: unknown) => setMessage({ tone: "error", text: getUserFacingErrorMessage(error) }),
    },
  };
}
