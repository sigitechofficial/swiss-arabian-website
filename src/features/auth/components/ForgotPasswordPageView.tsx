"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "@/components/ui/Toaster";
import { toastApiError } from "@/lib/api/toastApiError";
import { forgotPassword, toLoginIdentifier } from "../api/auth.service";
import {
  forgotPasswordSchema,
  type ForgotPasswordFormValues,
} from "../schemas/auth.schema";
import { AuthShell } from "./AuthShell";
import { AuthField, AuthSubmitButton } from "./AuthFormControls";

export function ForgotPasswordPageView() {
  const router = useRouter();
  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { identifier: "" },
  });

  async function onSubmit(values: ForgotPasswordFormValues) {
    try {
      await forgotPassword(toLoginIdentifier(values.identifier));
      toast("If an account exists, a reset code has been sent.", "success");
      router.push(
        `/reset-password?identifier=${encodeURIComponent(values.identifier)}`,
      );
    } catch (error) {
      toastApiError(error);
    }
  }

  return (
    <AuthShell heading="Forgot password" subtitle="We’ll send a one-time code if the account exists.">
      <form className="flex w-full flex-col gap-5" onSubmit={form.handleSubmit(onSubmit)}>
        <AuthField
          id="identifier"
          label="Email or phone"
          placeholder="you@email.com"
          autoComplete="username"
          {...form.register("identifier")}
          error={form.formState.errors.identifier?.message}
        />
        <AuthSubmitButton disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Sending…" : "Send reset code"}
        </AuthSubmitButton>
        <p className="text-center text-[12.5px] font-normal text-sa-secondary">
          <Link className="font-medium text-[var(--sa-action-primary)]" href="/login">
            Back to sign in
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
