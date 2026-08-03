"use client";

import Link from "next/link";
import { AuthCard } from "./AuthCard";
import { AuthPasswordField } from "./AuthPasswordField";
import { AuthSubmitButton } from "./AuthSubmitButton";

export function ResetPasswordPageView() {
  return (
    <AuthCard
      subtitle="Choose a new password for your account."
      title="Reset password"
    >
      <form
        className="flex w-full flex-col gap-5"
        onSubmit={(e) => {
          e.preventDefault();
        }}
      >
        <AuthPasswordField
          label="New password"
          name="password"
          placeholder="Enter your password"
          autoComplete="new-password"
        />
        <AuthPasswordField
          label="Confirm password"
          name="confirmPassword"
          placeholder="Enter your password"
          autoComplete="new-password"
        />
        <AuthSubmitButton type="button" disabled>
          Update password
        </AuthSubmitButton>
        <p className="text-center text-[13px] text-sa-secondary">
          <Link
            href="/login"
            className="font-semibold text-[var(--sa-action-primary)]"
          >
            Back to sign in
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}
