"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toastApiError } from "@/lib/api/toastApiError";
import { toast } from "@/components/ui/Toaster";
import { env } from "@/lib/config/env";
import { loginCustomer, requestEmailLoginCode, toLoginIdentifier } from "../api/auth.service";
import { applyAuthResult } from "../lib/applyAuthSession";
import { isAuthResult, isEmailVerificationRequired } from "../types/auth";
import { loginSchema, type LoginFormValues } from "../schemas/auth.schema";
import { AuthShell } from "./AuthShell";
import { AuthDivider, AuthField, AuthPasswordField, AuthSocialButtons, AuthSubmitButton } from "./AuthFormControls";

export function LoginPageView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo") || "/account";

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: "", password: "", remember: false },
  });

  async function onSubmit(values: LoginFormValues) {
    try {
      const result = await loginCustomer({
        identifier: toLoginIdentifier(values.identifier),
        password: values.password,
      });
      if (isEmailVerificationRequired(result)) {
        router.push(`/verify?email=${encodeURIComponent(result.email)}`);
        return;
      }
      if (isAuthResult(result)) {
        applyAuthResult(result);
        router.push(returnTo);
      }
    } catch (error) {
      toastApiError(error);
    }
  }

  async function onEmailCodeInstead() {
    const identifier = form.getValues("identifier").trim();
    if (!identifier.includes("@")) {
      toast("Enter your email above first.", "info");
      return;
    }
    try {
      await requestEmailLoginCode(identifier);
      toast("Check your email for a one-time sign-in code.", "success");
      router.push(`/verify?email=${encodeURIComponent(identifier)}&mode=login-code`);
    } catch (error) {
      toastApiError(error);
    }
  }

  return (
    <AuthShell heading="Welcome back" subtitle="Sign in to your account to purchase and check out.">
      <form className="flex w-full flex-col" onSubmit={form.handleSubmit(onSubmit)}>
        <AuthSocialButtons />
        <AuthDivider />
        <div className="flex w-full flex-col gap-4">
          <AuthField
            id="identifier"
            label="Email or phone"
            placeholder="you@example.com or +971…"
            autoComplete="username"
            {...form.register("identifier")}
            error={form.formState.errors.identifier?.message}
          />
          <AuthPasswordField
            id="password"
            label="Password"
            autoComplete="current-password"
            placeholder="Your password"
            {...form.register("password")}
            error={form.formState.errors.password?.message}
          />
        </div>
        <div className="flex items-center justify-between gap-3 pb-1 pt-3">
          <label htmlFor="remember" className="flex cursor-pointer items-center gap-2 text-[12.5px] font-normal text-sa-secondary">
            <input
              id="remember"
              type="checkbox"
              className="auth-checkbox size-[16px] shrink-0"
              {...form.register("remember")}
            />
            <span>Remember me</span>
          </label>
          {env.flags.passwordReset ? (
            <Link
              className="shrink-0 text-[12.5px] font-normal text-sa-primary underline underline-offset-2 hover:text-terra"
              href="/forgot-password"
            >
              Forgot password?
            </Link>
          ) : null}
        </div>
        <div className="pt-5">
          <AuthSubmitButton disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Signing in…" : "Sign in"}
          </AuthSubmitButton>
        </div>
        {env.flags.verification ? (
          <button
            type="button"
            className="mt-4 cursor-pointer text-center text-[12.5px] font-normal text-sa-primary underline underline-offset-2 hover:text-terra"
            onClick={onEmailCodeInstead}
          >
            Email me a one-time sign-in code instead
          </button>
        ) : null}
        <p className="mt-6 text-center text-[13px] font-normal text-sa-secondary">
          New to Swiss Arabian?{" "}
          <Link className="font-medium text-terra hover:text-[var(--sa-action-primary-hover)]" href="/register">
            Create an account
          </Link>
        </p>
        <p className="mt-4 text-center text-[11px] font-normal leading-relaxed text-sa-muted">
          By continuing you agree to Swiss Arabian&apos;s Terms &amp; Conditions and Privacy Policy.
        </p>
      </form>
    </AuthShell>
  );
}
