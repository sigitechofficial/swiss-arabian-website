"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "@/components/ui/Toaster";
import { env } from "@/lib/config/env";
import { getUserFacingErrorMessage } from "@/lib/api/userFacingErrors";
import {
  confirmPhoneVerification,
  fetchCustomerMe,
  resendOtp,
  toE164Phone,
} from "../api/auth.service";
import { applyCustomerProfile } from "../lib/applyAuthSession";
import { verifySchema, type VerifyFormValues } from "../schemas/verifySchema";
import { AuthCard } from "./AuthCard";
import { AuthOtpInput } from "./AuthOtpInput";
import { AuthSubmitButton } from "./AuthSubmitButton";

function maskPhone(phone: string) {
  const trimmed = phone.trim();
  if (!trimmed) return "your phone";
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length < 4) return trimmed;
  const last2 = digits.slice(-2);
  const prefix = trimmed.startsWith("+")
    ? trimmed.split(/\s+/)[0]
    : `+${digits.slice(0, Math.min(3, digits.length - 2))}`;
  return `${prefix} ${digits.slice(3, 5) || "xx"} xxx ${last2}`;
}

export function VerifyPageView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const phoneRaw = searchParams.get("phone") ?? "";
  const phone = phoneRaw ? toE164Phone(phoneRaw) : "";
  const [seconds, setSeconds] = useState(30);

  const subtitle = useMemo(
    () => `Code sent to ${maskPhone(phone)}`,
    [phone],
  );

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<VerifyFormValues>({
    resolver: zodResolver(verifySchema),
    defaultValues: { code: "" },
  });

  useEffect(() => {
    if (seconds <= 0) return;
    const id = window.setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => window.clearTimeout(id);
  }, [seconds]);

  if (!env.flags.verification) {
    return (
      <AuthCard
        subtitle="Verification is turned off for this environment."
        title="Verify your number"
      >
        <Link
          href="/account"
          className="text-center text-[13px] font-semibold text-[var(--sa-action-primary)]"
        >
          Continue to account
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard subtitle={subtitle} title="Verify your number">
      <form
        className="flex w-full flex-col gap-5"
        onSubmit={handleSubmit(async (values) => {
          if (!phone) {
            toast("Missing phone number. Register again.", "error");
            return;
          }
          try {
            await confirmPhoneVerification(phone, values.code);
            try {
              const me = await fetchCustomerMe();
              applyCustomerProfile(me);
            } catch {
              // optional hydrate
            }
            toast("Phone verified", "success");
            router.push("/account");
          } catch (error) {
            toast(getUserFacingErrorMessage(error), "error");
          }
        })}
      >
        <Controller
          name="code"
          control={control}
          render={({ field }) => (
            <AuthOtpInput
              value={field.value}
              onChange={field.onChange}
              error={errors.code?.message}
            />
          )}
        />

        <p className="flex flex-wrap items-center justify-center gap-1 text-[13px]">
          <span className="text-sa-secondary">Didn&apos;t receive it?</span>
          {seconds > 0 ? (
            <span className="font-semibold text-[var(--sa-action-primary)]">
              Resend in 0:{String(seconds).padStart(2, "0")}
            </span>
          ) : (
            <button
              type="button"
              className="font-semibold text-[var(--sa-action-primary)] hover:text-[var(--sa-action-primary-hover)]"
              onClick={async () => {
                if (!phone) return;
                try {
                  await resendOtp(phone, "VERIFY_PHONE");
                  setSeconds(30);
                  toast(
                    "If the account exists, a verification code has been sent.",
                    "success",
                  );
                } catch (error) {
                  toast(getUserFacingErrorMessage(error), "error");
                }
              }}
            >
              Resend code
            </button>
          )}
        </p>

        <Link
          href="/register"
          className="text-center text-[13px] text-sa-secondary hover:text-sa-primary"
        >
          Use a different number
        </Link>

        <AuthSubmitButton disabled={isSubmitting || !phone}>
          Verify and continue
        </AuthSubmitButton>
      </form>
    </AuthCard>
  );
}
