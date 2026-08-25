"use client";

import { forwardRef, useState, type ButtonHTMLAttributes, type InputHTMLAttributes } from "react";
import { toast } from "@/components/ui/Toaster";

type AuthFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  hint?: string;
};

/** Text input styled to match the reference auth pages' `sa-input` fields —
 *  label above, pill-cornered bordered box, optional hint/error line below. */
export const AuthField = forwardRef<HTMLInputElement, AuthFieldProps>(function AuthField(
  { label, error, hint, id, ...props },
  ref,
) {
  return (
    <div className="flex w-full flex-col gap-1">
      <label htmlFor={id} className="text-[12px] font-normal leading-normal text-sa-secondary">
        {label}
      </label>
      <div
        className={`flex items-center rounded-[10px] border bg-surface py-2.5 pl-4 pr-3 ${
          error ? "border-[var(--sa-action-danger)]" : "border-sa-input"
        }`}
      >
        <input
          ref={ref}
          id={id}
          className="min-w-0 flex-1 bg-transparent text-[13.5px] font-normal text-sa-primary outline-none placeholder:text-sa-muted"
          {...props}
        />
      </div>
      {hint ? <p className="text-[11px] leading-normal text-sa-secondary">{hint}</p> : null}
      {error ? <p className="text-[11px] leading-normal text-[var(--sa-action-danger)]">{error}</p> : null}
    </div>
  );
});

/** Same shell as `AuthField` plus the eye-toggle button that reveals the
 *  password value, matching the reference's `eye-outline.svg` icon button. */
export const AuthPasswordField = forwardRef<HTMLInputElement, AuthFieldProps>(function AuthPasswordField(
  { label, error, id, ...props },
  ref,
) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="flex w-full flex-col gap-1">
      <label htmlFor={id} className="text-[12px] font-normal leading-normal text-sa-secondary">
        {label}
      </label>
      <div
        className={`flex items-center rounded-[10px] border bg-surface py-2.5 pl-4 pr-3 ${
          error ? "border-[var(--sa-action-danger)]" : "border-sa-input"
        }`}
      >
        <input
          ref={ref}
          id={id}
          type={visible ? "text" : "password"}
          className="min-w-0 flex-1 bg-transparent text-[13.5px] font-normal text-sa-primary outline-none placeholder:text-sa-muted"
          {...props}
        />
        <button
          type="button"
          className="-m-1.5 ml-1 flex size-[18px] shrink-0 cursor-pointer items-center justify-center text-sa-muted"
          aria-label={visible ? "Hide password" : "Show password"}
          onClick={() => setVisible((v) => !v)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/auth/eye-outline.svg" alt="" width={18} height={18} className="block size-[18px]" />
        </button>
      </div>
      {error ? <p className="text-[11px] leading-normal text-[var(--sa-action-danger)]">{error}</p> : null}
    </div>
  );
});

/** Google/Apple buttons — social sign-in isn't wired to the backend yet, so
 *  these surface an honest "not connected" toast instead of faking success. */
export function AuthSocialButtons() {
  return (
    <div className="flex w-full flex-col gap-2">
      <button
        type="button"
        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-sa-border bg-surface py-2.5 text-[13px] font-normal text-sa-primary transition-colors hover:bg-section-soft"
        onClick={() => toast("Google sign-in isn't connected yet.", "info")}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/auth/google.svg" alt="" width={16} height={16} className="size-[16px] shrink-0" />
        Continue with Google
      </button>
      <button
        type="button"
        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-sa-border bg-surface py-2.5 text-[13px] font-normal text-sa-primary transition-colors hover:bg-section-soft"
        onClick={() => toast("Apple sign-in isn't connected yet.", "info")}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/auth/apple.svg" alt="" width={16} height={16} className="size-[16px] shrink-0" />
        Continue with Apple
      </button>
    </div>
  );
}

export function AuthDivider({ label = "Or" }: { label?: string }) {
  return (
    <div className="flex w-full items-center gap-3 py-4">
      <span className="h-px flex-1 bg-sa-border" aria-hidden="true" />
      <span className="text-[11px] font-normal uppercase tracking-[0.08em] text-sa-muted">{label}</span>
      <span className="h-px flex-1 bg-sa-border" aria-hidden="true" />
    </div>
  );
}

export function AuthSubmitButton({
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="submit"
      className="flex w-full cursor-pointer items-center justify-center rounded-full bg-terra py-3.5 text-[13.5px] font-medium text-white transition-colors hover:bg-[var(--sa-action-primary-hover)] disabled:cursor-not-allowed disabled:opacity-60"
      {...props}
    >
      {children}
    </button>
  );
}
