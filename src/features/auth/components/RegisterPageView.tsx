"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toastApiError } from "@/lib/api/toastApiError";
import { env } from "@/lib/config/env";
import {
  DEFAULT_ZONE_CODE,
  toAuthSalesChannelCode,
  toAuthZoneCode,
} from "@/lib/storefront/context";
import { registerCustomer, splitFullName, toE164Phone } from "../api/auth.service";
import { applyAuthResult } from "../lib/applyAuthSession";
import { registerSchema, type RegisterFormValues } from "../schemas/auth.schema";
import { AuthShell } from "./AuthShell";
import { AuthDivider, AuthField, AuthPasswordField, AuthSocialButtons, AuthSubmitButton } from "./AuthFormControls";

export function RegisterPageView() {
  const router = useRouter();
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: "", email: "", phone: "", password: "" },
  });

  async function onSubmit(values: RegisterFormValues) {
    try {
      const { firstName, lastName } = splitFullName(values.fullName);
      const result = await registerCustomer({
        zoneCode: toAuthZoneCode(DEFAULT_ZONE_CODE),
        salesChannelCode: toAuthSalesChannelCode(DEFAULT_ZONE_CODE),
        email: values.email,
        phone: toE164Phone(values.phone),
        password: values.password,
        firstName,
        lastName,
      });
      applyAuthResult(result);
      router.push("/account");
    } catch (error) {
      toastApiError(error);
    }
  }

  return (
    <AuthShell heading="Create an account" subtitle="Join Swiss Arabian to check out faster and save your favourites.">
      <form className="flex w-full flex-col" onSubmit={form.handleSubmit(onSubmit)}>
        {env.flags.oauth ? (
          <>
            <AuthSocialButtons />
            <AuthDivider />
          </>
        ) : null}
        <div className="flex w-full flex-col gap-4">
          <AuthField
            id="fullName"
            label="Full name"
            placeholder="Aisha Al Nuaimi"
            autoComplete="name"
            {...form.register("fullName")}
            error={form.formState.errors.fullName?.message}
          />
          <AuthField
            id="email"
            label="Email address"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            {...form.register("email")}
            error={form.formState.errors.email?.message}
          />
          <AuthField
            id="mobile"
            label="Mobile number"
            type="tel"
            placeholder="+971 50 123 4567"
            autoComplete="tel"
            hint="Include country code (e.g. +971)."
            {...form.register("phone")}
            error={form.formState.errors.phone?.message}
          />
          <AuthPasswordField
            id="password"
            label="Password"
            autoComplete="new-password"
            placeholder="Your password"
            {...form.register("password")}
            error={form.formState.errors.password?.message}
          />
        </div>
        <div className="pt-5">
          <AuthSubmitButton disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Creating…" : "Create account"}
          </AuthSubmitButton>
        </div>
        <p className="mt-6 text-center text-[13px] font-normal text-sa-secondary">
          Already registered?{" "}
          <Link className="font-medium text-terra hover:text-[var(--sa-action-primary-hover)]" href="/login">
            Sign in
          </Link>
        </p>
        <p className="mt-4 text-center text-[11px] font-normal leading-relaxed text-sa-muted">
          By continuing you agree to Swiss Arabian&apos;s Terms &amp; Conditions and Privacy Policy.
        </p>
      </form>
    </AuthShell>
  );
}
