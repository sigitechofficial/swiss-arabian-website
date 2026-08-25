"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "@/components/ui/Toaster";
import { env } from "@/lib/config/env";
import { endSession } from "@/lib/auth/endSession";
import { getUserFacingErrorMessage } from "@/lib/api/userFacingErrors";
import { resetPassword, toLoginIdentifier } from "../api/auth.service";
import {
  resetPasswordSchema,
  type ResetPasswordFormValues,
} from "../schemas/passwordResetSchema";
import { AuthCard } from "./AuthCard";
import { AuthField } from "./AuthField";
import { AuthPasswordField } from "./AuthPasswordField";
import { AuthSubmitButton } from "./AuthSubmitButton";

export function ResetPasswordPageView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const presetIdentifier = searchParams.get("identifier") ?? "";

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      identifier: presetIdentifier,
      code: 0,
      newPassword: "",
      confirmPassword: "",
    },
  });

  if (!env.flags.passwordReset) {
    return (
      <AuthCard
        subtitle="Password reset is disabled in this environment."
        title="Reset password"
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
      subtitle="Enter the code and choose a new password."
      title="Reset password"
    >
      <form
        className="flex w-full flex-col gap-5"
        onSubmit={handleSubmit(async (values) => {
          try {
            await resetPassword({
              identifier: toLoginIdentifier(values.identifier),
              code: values.code,
              newPassword: values.newPassword,
            });
            // All sessions revoked on BE — clear local tokens
            endSession();
            toast("Password updated. Please sign in.", "success");
            router.push("/login");
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
        <AuthField
          label="Reset code"
          placeholder="123456"
          autoComplete="one-time-code"
          {...register("code")}
          error={errors.code?.message}
        />
        <AuthPasswordField
          label="New password"
          placeholder="Enter your password"
          autoComplete="new-password"
          {...register("newPassword")}
          error={errors.newPassword?.message}
        />
        <AuthPasswordField
          label="Confirm password"
          placeholder="Enter your password"
          autoComplete="new-password"
          {...register("confirmPassword")}
          error={errors.confirmPassword?.message}
        />
        <AuthSubmitButton disabled={isSubmitting}>
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
