"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "@/components/ui/Toaster";
import { toastApiError } from "@/lib/api/toastApiError";
import { resetPassword, toLoginIdentifier } from "../api/auth.service";
import {
  resetPasswordSchema,
  type ResetPasswordFormValues,
} from "../schemas/auth.schema";
import { AuthShell } from "./AuthShell";
import { AuthPasswordField, AuthSubmitButton } from "./AuthFormControls";
import { AuthOtpField } from "./AuthOtpField";

export function ResetPasswordPageView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      identifier: searchParams.get("identifier") ?? "",
      code: "",
      newPassword: "",
    },
  });

  async function onSubmit(values: ResetPasswordFormValues) {
    try {
      await resetPassword({
        identifier: toLoginIdentifier(values.identifier),
        code: values.code,
        newPassword: values.newPassword,
      });
      toast("Password updated. Please sign in.", "success");
      router.push("/login");
    } catch (error) {
      toastApiError(error);
    }
  }

  return (
    <AuthShell heading="Reset password" subtitle="Enter the code we sent you and choose a new password.">
      <form className="flex w-full flex-col gap-4" onSubmit={form.handleSubmit(onSubmit)}>
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
          value={form.watch("code")}
          onChange={(code) => form.setValue("code", code, { shouldValidate: true, shouldDirty: true })}
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
          <Link className="font-medium text-[var(--sa-action-primary)]" href="/login">
            Back to sign in
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
