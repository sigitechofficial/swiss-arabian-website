"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "@/components/ui/Toaster";
import {
  DEFAULT_ZONE_CODE,
  toAuthSalesChannelCode,
  toAuthZoneCode,
} from "@/lib/storefront/context";
import { getUserFacingErrorMessage } from "@/lib/api/userFacingErrors";
import { useMarket } from "@/providers/MarketProvider";
import {
  registerCustomer,
  splitFullName,
  toE164Phone,
} from "../api/auth.service";
import { applyAuthResult } from "../lib/applyAuthSession";
import {
  registerSchema,
  type RegisterFormValues,
} from "../schemas/registerSchema";
import { AuthCard } from "./AuthCard";
import { AuthCheckbox } from "./AuthCheckbox";
import { AuthField } from "./AuthField";
import { AuthPasswordField } from "./AuthPasswordField";
import { AuthOrDivider, AuthSocialButtons } from "./AuthSocialButtons";
import { AuthSubmitButton } from "./AuthSubmitButton";

/** Phase 1B — register is non-blocking (tokens immediately, no mandatory OTP). */
export function RegisterPageView() {
  const router = useRouter();
  const { marketId } = useMarket();
  const zoneCode = toAuthZoneCode(marketId || DEFAULT_ZONE_CODE);
  const salesChannelCode = toAuthSalesChannelCode(zoneCode);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      marketingConsent: false,
      smsConsent: false,
    },
  });

  return (
    <AuthCard
      title="Create an account"
      subtitle="Join Swiss Arabian to check out faster and save your favourites."
    >
      <form
        className="flex w-full flex-col"
        onSubmit={handleSubmit(async (values) => {
          try {
            const { firstName, lastName } = splitFullName(values.fullName);
            const phone = toE164Phone(values.mobile);
            const result = await registerCustomer({
              zoneCode,
              email: values.email.trim(),
              phone,
              password: values.password,
              firstName,
              lastName,
              salesChannelCode,
              marketingConsent: values.marketingConsent,
              smsConsent: values.smsConsent,
            });
            applyAuthResult(result);
            toast("Account created", "success");
            router.push("/account");
          } catch (error) {
            toast(getUserFacingErrorMessage(error), "error");
          }
        })}
      >
        <AuthSocialButtons />
        <AuthOrDivider />

        <div className="flex w-full flex-col gap-4">
          <AuthField
            label="Full name"
            placeholder="Aisha Al Nuaimi"
            autoComplete="name"
            {...register("fullName")}
            error={errors.fullName?.message}
          />
          <AuthField
            label="Email address"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            {...register("email")}
            error={errors.email?.message}
          />
          <AuthField
            label="Mobile number"
            type="tel"
            placeholder="+971 50 123 4567"
            autoComplete="tel"
            hint="Include country code (e.g. +971)."
            {...register("mobile")}
            error={errors.mobile?.message}
          />
          <AuthPasswordField
            placeholder="Your password"
            autoComplete="new-password"
            {...register("password")}
            error={errors.password?.message}
          />
        </div>

        <div className="flex flex-col gap-3 pt-4">
          <AuthCheckbox
            label="Email me with news and offers"
            {...register("marketingConsent")}
          />
          <AuthCheckbox
            label="Text me with news and offers"
            {...register("smsConsent")}
          />
        </div>

        <div className="pt-5">
          <AuthSubmitButton disabled={isSubmitting}>
            Create account
          </AuthSubmitButton>
        </div>

        <p className="mt-6 text-center text-[15px] text-sa-secondary">
          Already registered?{" "}
          <Link
            href="/login"
            className="font-medium text-terra hover:text-[var(--sa-action-primary-hover)]"
          >
            Sign in
          </Link>
        </p>

        <p className="mt-4 text-center text-[12px] leading-relaxed text-sa-muted">
          By continuing you agree to Swiss Arabian&apos;s Terms &amp; Conditions
          and Privacy Policy.
        </p>
      </form>
    </AuthCard>
  );
}
