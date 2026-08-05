"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "@/components/ui/Toaster";
import { getUserFacingErrorMessage } from "@/lib/api/userFacingErrors";
import {
  loginCustomer,
  toLoginIdentifier,
} from "../api/auth.service";
import { applyAuthResult } from "../lib/applyAuthSession";
import { loginSchema, type LoginFormValues } from "../schemas/loginSchema";
import { AuthCard } from "./AuthCard";
import { AuthCheckbox } from "./AuthCheckbox";
import { AuthField } from "./AuthField";
import { AuthPasswordField } from "./AuthPasswordField";
import { AuthSubmitButton } from "./AuthSubmitButton";

export function LoginPageView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo") || "/account";

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { remember: false },
  });

  return (
    <AuthCard
      subtitle="Welcome back to Swiss Arabian."
      title="Sign in"
    >
      <form
        className="flex w-full flex-col gap-5"
        onSubmit={handleSubmit(async (values) => {
          try {
            const result = await loginCustomer({
              identifier: toLoginIdentifier(values.identifier),
              password: values.password,
            });
            applyAuthResult(result);
            toast("Welcome back", "success");
            router.push(returnTo.startsWith("/") ? returnTo : "/account");
          } catch (error) {
            toast(getUserFacingErrorMessage(error), "error");
          }
        })}
      >
        <div className="flex w-full flex-col gap-4">
          <AuthField
            label="Email or phone"
            placeholder="you@email.com"
            autoComplete="username"
            {...register("identifier")}
            error={errors.identifier?.message}
          />
          <AuthPasswordField
            placeholder="Enter your password"
            forgotHref="/forgot-password"
            {...register("password")}
            error={errors.password?.message}
          />
        </div>

        <AuthCheckbox label="Keep me signed in" {...register("remember")} />

        <AuthSubmitButton disabled={isSubmitting}>Sign in</AuthSubmitButton>

        <p className="flex flex-wrap items-center justify-center gap-1 text-center text-[13px]">
          <span className="text-sa-secondary">New to Swiss Arabian?</span>
          <Link
            href="/register"
            className="font-semibold text-[var(--sa-action-primary)] hover:text-[var(--sa-action-primary-hover)]"
          >
            Create an account
          </Link>
        </p>

        <div className="h-px w-full bg-sa-border" aria-hidden />
      </form>
    </AuthCard>
  );
}
