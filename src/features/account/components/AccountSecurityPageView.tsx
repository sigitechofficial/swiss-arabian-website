"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { useChangePassword, type ChangePasswordValues } from "../hooks/useAccountPages";

import { accountBtnPrimary, accountInputClass } from "../constants/accountForm";
import { accountContainer } from "../constants/accountLayout";
import { AccountPageShell } from "./AccountPageShell";
import { AccountPageTitle } from "./AccountPageTitle";

function PasswordField({
  id,
  label,
  autoComplete,
  error,
  register,
}: {
  id: keyof ChangePasswordValues;
  label: string;
  autoComplete: string;
  error?: string;
  register: ReturnType<typeof useForm<ChangePasswordValues>>["register"];
}) {
  const [visible, setVisible] = useState(false);
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-sa-muted">
        {label}
      </span>
      <span className="relative block">
        <input
          id={id}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          className={`${accountInputClass} pr-11`}
          {...register(id)}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          className="absolute inset-y-0 right-0 flex w-11 cursor-pointer items-center justify-center text-sa-muted hover:text-terra"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
            <circle cx="12" cy="12" r="3" />
            {visible ? <path d="M4 20 20 4" /> : null}
          </svg>
        </button>
      </span>
      {error ? <span className="mt-1 block text-[11px] text-red-600">{error}</span> : null}
    </label>
  );
}

/**
 * Security — change password. The backend revokes existing sessions on a
 * password change, so the shopper is signed out here and sent to sign in again.
 */
export function AccountSecurityPageView() {
  const {
    form: {
      register,
      formState: { errors, isSubmitting },
    },
    done,
    submit,
  } = useChangePassword();

  return (
    <AccountPageShell>
      <AccountPageTitle
        title="Security"
        subtitle="Change the password you use to sign in."
      />

      <div className={`${accountContainer} pb-20`}>
        <section className="max-w-[560px] rounded-lg border border-sa-border bg-surface p-5 sm:p-6">
          <h2 className="text-[15px] font-semibold text-sa-primary">Change password</h2>
          <p className="mt-1 text-[12.5px] text-sa-secondary">
            Use at least 8 characters. You’ll be signed out on this and any other device.
          </p>

          <form className="mt-5 flex flex-col gap-4" onSubmit={submit} noValidate>
            <PasswordField
              id="currentPassword"
              label="Current password"
              autoComplete="current-password"
              error={errors.currentPassword?.message}
              register={register}
            />
            <PasswordField
              id="newPassword"
              label="New password"
              autoComplete="new-password"
              error={errors.newPassword?.message}
              register={register}
            />
            <PasswordField
              id="confirmPassword"
              label="Confirm new password"
              autoComplete="new-password"
              error={errors.confirmPassword?.message}
              register={register}
            />

            <div className="pt-1">
              <button type="submit" className={accountBtnPrimary} disabled={isSubmitting || done}>
                {isSubmitting ? "Updating…" : "Update password"}
              </button>
            </div>
          </form>
        </section>

        <p className="mt-4 max-w-[560px] text-[12px] text-sa-secondary">
          Forgotten your current password?{" "}
          <Link className="font-semibold text-terra hover:underline" href="/forgot-password">
            Reset it by email
          </Link>
          .
        </p>
      </div>
    </AccountPageShell>
  );
}
