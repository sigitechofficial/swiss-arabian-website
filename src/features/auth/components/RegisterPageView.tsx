"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  registerSchema,
  type RegisterFormValues,
} from "../schemas/registerSchema";
import { AuthCard } from "./AuthCard";
import { AuthField } from "./AuthField";
import { AuthPasswordField } from "./AuthPasswordField";
import { AuthSubmitButton } from "./AuthSubmitButton";

export function RegisterPageView() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  return (
    <AuthCard
      subtitle="Join the house in about a minute."
      title="Create account"
    >
      <form
        className="flex w-full flex-col gap-5"
        onSubmit={handleSubmit(async (values) => {
          // Register API not wired yet — continue to OTP step with phone in query.
          const phone = encodeURIComponent(values.mobile.trim());
          router.push(`/verify?phone=${phone}`);
        })}
      >
        <div className="flex w-full flex-col gap-4">
          <AuthField
            label="Full name"
            placeholder="Aisha Al Nuaimi"
            autoComplete="name"
            {...register("fullName")}
            error={errors.fullName?.message}
          />
          <AuthField
            label="Email"
            type="email"
            placeholder="you@email.com"
            autoComplete="email"
            {...register("email")}
            error={errors.email?.message}
          />
          <AuthField
            label="Mobile number"
            type="tel"
            placeholder="+971 50 123 4567"
            autoComplete="tel"
            hint="We'll send a verification code."
            {...register("mobile")}
            error={errors.mobile?.message}
          />
          <AuthPasswordField
            placeholder="Enter your password"
            autoComplete="new-password"
            {...register("password")}
            error={errors.password?.message}
          />
        </div>

        <p className="text-center text-xs leading-normal text-sa-secondary">
          By continuing you agree to Swiss Arabian&apos;s Terms and Privacy
          Policy.
        </p>

        <AuthSubmitButton disabled={isSubmitting}>
          Create account
        </AuthSubmitButton>

        <p className="flex flex-wrap items-center justify-center gap-1 text-center text-[13px]">
          <span className="text-sa-secondary">Already registered?</span>
          <Link
            href="/login"
            className="font-semibold text-[var(--sa-action-primary)] hover:text-[var(--sa-action-primary-hover)]"
          >
            Sign in
          </Link>
        </p>

        <div className="h-px w-full bg-sa-border" aria-hidden />

        <p className="flex flex-wrap items-center justify-center gap-1 text-center text-xs">
          <span className="text-sa-secondary">Buying for a store?</span>
          <a
            href="mailto:stockists@swissarabian.com"
            className="font-semibold text-[var(--sa-action-primary)] hover:text-[var(--sa-action-primary-hover)]"
          >
            Apply as a stockist
          </a>
        </p>
      </form>
    </AuthCard>
  );
}
