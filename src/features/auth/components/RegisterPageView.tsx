"use client";

import { LocaleLink } from "@/lib/i18n/LocaleLink";
import { Controller } from "react-hook-form";
import { useRegisterForm } from "../hooks/useAuthForms";
import { AuthShell } from "./AuthShell";
import { PhoneNumberField } from "@/components/ui/PhoneNumberField";
import { AuthDivider, AuthField, AuthPasswordField, AuthSocialButtons, AuthSubmitButton } from "./AuthFormControls";

export function RegisterPageView() {
  const { form, oauthEnabled, submit } = useRegisterForm();

  return (
    <AuthShell heading="Create an account" subtitle="Join Swiss Arabian to check out faster and save your favourites.">
      <form className="flex w-full flex-col" onSubmit={submit}>
        {oauthEnabled ? (
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
          <Controller
            name="phone"
            control={form.control}
            render={({ field }) => (
              <PhoneNumberField
                id="mobile"
                value={field.value ?? ""}
                onChange={field.onChange}
                onBlur={field.onBlur}
                hint="Choose your country, then enter the number without the code."
                error={form.formState.errors.phone?.message}
              />
            )}
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
          <LocaleLink className="font-medium text-terra hover:text-[var(--sa-action-primary-hover)]" href="/login">
            Sign in
          </LocaleLink>
        </p>
        <p className="mt-4 text-center text-[11px] font-normal leading-relaxed text-sa-muted">
          By continuing you agree to Swiss Arabian&apos;s Terms &amp; Conditions and Privacy Policy.
        </p>
      </form>
    </AuthShell>
  );
}
