"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "@/components/ui/Toaster";
import { env } from "@/lib/config/env";
import { getUserFacingErrorMessage } from "@/lib/api/userFacingErrors";
import { forgotPassword, toLoginIdentifier } from "../api/auth.service";
import {
  forgotPasswordSchema,
  type ForgotPasswordFormValues,
} from "../schemas/passwordResetSchema";
import { AuthCard } from "./AuthCard";
import { AuthField } from "./AuthField";
import { AuthSubmitButton } from "./AuthSubmitButton";

export function ForgotPasswordPageView() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  if (!env.flags.passwordReset) {
    return (
      <AuthCard
        subtitle="Password reset is disabled in this environment."
        title="Forgot password"
      >
        <Link
          href="/login"
          className="text-center text-[13px] font-semibold text-[var(--sa-action-primary)]"
        >
          Back to sign in
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      subtitle="We’ll send a one-time code if the account exists."
      title="Forgot password"
    >
      <form
        className="flex w-full flex-col gap-5"
        onSubmit={handleSubmit(async (values) => {
          const identifier = toLoginIdentifier(values.identifier);
          try {
            await forgotPassword(identifier);
            toast(
              "If the account exists, a verification code has been sent.",
              "success",
            );
            router.push(
              `/reset-password?identifier=${encodeURIComponent(identifier)}`,
            );
          } catch (error) {
            toast(getUserFacingErrorMessage(error), "error");
          }
        })}
      >
        <AuthField
          label="Email or phone"
          placeholder="you@email.com"
          autoComplete="username"
          {...register("identifier")}
          error={errors.identifier?.message}
        />
        <AuthSubmitButton disabled={isSubmitting}>
          Send reset code
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
