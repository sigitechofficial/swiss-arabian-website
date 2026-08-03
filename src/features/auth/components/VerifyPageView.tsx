"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "@/components/ui/Toaster";
import { verifySchema, type VerifyFormValues } from "../schemas/verifySchema";
import { AuthCard } from "./AuthCard";
import { AuthOtpInput } from "./AuthOtpInput";
import { AuthSubmitButton } from "./AuthSubmitButton";

function maskPhone(phone: string) {
  const trimmed = phone.trim();
  if (!trimmed) return "+971 50 xxx 34";
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length < 4) return trimmed;
  const last2 = digits.slice(-2);
  const prefix = trimmed.startsWith("+")
    ? trimmed.split(/\s+/)[0]
    : `+${digits.slice(0, Math.min(3, digits.length - 2))}`;
  return `${prefix} ${digits.slice(3, 5) || "xx"} xxx ${last2}`;
}

export function VerifyPageView() {
  const searchParams = useSearchParams();
  const phone = searchParams.get("phone") ?? "";
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

  return (
    <AuthCard subtitle={subtitle} title="Verify your number">
      <form
        className="flex w-full flex-col gap-5"
        onSubmit={handleSubmit(async () => {
          toast(
            "Phone verification isn’t available yet. Please try again later.",
            "error",
          );
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
              onClick={() => {
                setSeconds(30);
                toast(
                  "Resend isn’t available until verification is connected.",
                  "error",
                );
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

        <AuthSubmitButton disabled={isSubmitting}>
          Verify and continue
        </AuthSubmitButton>
      </form>
    </AuthCard>
  );
}
