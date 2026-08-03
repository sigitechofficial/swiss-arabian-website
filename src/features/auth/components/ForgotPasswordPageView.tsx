"use client";

import Link from "next/link";
import { AuthCard } from "./AuthCard";
import { AuthField } from "./AuthField";
import { AuthSubmitButton } from "./AuthSubmitButton";

export function ForgotPasswordPageView() {
  return (
    <AuthCard
      subtitle="We’ll email you a reset link."
      title="Forgot password"
    >
      <form
        className="flex w-full flex-col gap-5"
        onSubmit={(e) => {
          e.preventDefault();
        }}
      >
        <AuthField
          label="Email"
          type="email"
          name="email"
          placeholder="you@email.com"
          autoComplete="email"
        />
        <AuthSubmitButton type="button" disabled>
          Send reset link
        </AuthSubmitButton>
        <p className="text-center text-[13px] text-sa-secondary">
          Password reset connects to store auth endpoints next.{" "}
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
