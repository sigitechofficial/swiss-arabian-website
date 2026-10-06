"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "@/components/ui/Toaster";
import { toastApiError } from "@/lib/api/toastApiError";
import { env } from "@/lib/config/env";
import {
  confirmEmailLoginCode,
  confirmEmailVerification,
  requestEmailLoginCode,
  requestEmailVerification,
} from "../api/auth.service";
import { applyAuthResult } from "../lib/applyAuthSession";
import { AuthShell } from "./AuthShell";
import { AuthSubmitButton } from "./AuthFormControls";
import { AuthOtpField } from "./AuthOtpField";

const verifySchema = z.object({
  code: z.string().regex(/^\d{6}$/, "Enter the 6-digit code we sent you"),
});

type VerifyFormValues = z.infer<typeof verifySchema>;

export function VerifyPageView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const isLoginCode = searchParams.get("mode") === "login-code";
  const [resending, setResending] = useState(false);

  const form = useForm<VerifyFormValues>({
    resolver: zodResolver(verifySchema),
    defaultValues: { code: "" },
  });

  if (!env.flags.verification) {
    return (
      <AuthShell heading="Verification" subtitle="Verification is currently disabled.">
        <p className="text-center text-[12.5px] font-normal text-sa-secondary">
          <Link className="font-medium text-terra" href="/login">
            Back to sign in
          </Link>
        </p>
      </AuthShell>
    );
  }

  async function onSubmit(values: VerifyFormValues) {
    try {
      if (isLoginCode) {
        const result = await confirmEmailLoginCode({ email, code: values.code });
        applyAuthResult(result);
        toast("Signed in.", "success");
        router.push("/account");
        return;
      }
      await confirmEmailVerification(email, values.code);
      toast("Email verified. Please sign in.", "success");
      router.push("/login");
    } catch (error) {
      toastApiError(error);
    }
  }

  async function onResend() {
    if (!email) return;
    setResending(true);
    try {
      if (isLoginCode) {
        await requestEmailLoginCode(email);
      } else {
        await requestEmailVerification(email);
      }
      toast("Code resent — check your email.", "success");
    } catch (error) {
      toastApiError(error);
    } finally {
      setResending(false);
    }
  }

  return (
    <AuthShell
      heading="Verify your account"
      subtitle={email ? `Enter the code we sent to ${email}.` : "Enter the verification code you received."}
    >
      <form className="flex w-full flex-col gap-5" onSubmit={form.handleSubmit(onSubmit)}>
        <AuthOtpField
          id="code"
          label="Verification code"
          autoFocus
          value={form.watch("code")}
          onChange={(code) => form.setValue("code", code, { shouldValidate: true, shouldDirty: true })}
          error={form.formState.errors.code?.message}
        />
        <AuthSubmitButton disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Verifying…" : "Verify"}
        </AuthSubmitButton>
        <p className="text-center text-[12.5px] font-normal text-sa-secondary">
          Didn&apos;t get a code?{" "}
          <button
            type="button"
            className="font-medium text-terra disabled:opacity-60"
            onClick={onResend}
            disabled={resending || !email}
          >
            {resending ? "Sending…" : "Resend"}
          </button>
        </p>
      </form>
    </AuthShell>
  );
}
