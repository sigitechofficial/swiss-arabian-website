"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useApiQuery } from "@/lib/api/queryHooks";
import { PageLoading } from "@/components/ui";
import { toast } from "@/components/ui/Toaster";
import { getUserFacingErrorMessage } from "@/lib/api/userFacingErrors";
import { endSession } from "@/lib/auth/endSession";
import {
  authKeys,
  changeCustomerPassword,
  fetchCustomerSessions,
  revokeCustomerSession,
} from "@/features/auth/api/auth.service";
import { performLogoutAll } from "@/features/auth/lib/performLogout";

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(8, "Enter your current password"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Confirm your password"),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ChangePasswordValues = z.infer<typeof changePasswordSchema>;

export function AccountSecurityPageView() {
  const router = useRouter();
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const {
    data: sessions,
    isLoading,
    refetch,
  } = useApiQuery(authKeys.sessions(), () => fetchCustomerSessions());

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
  });

  return (
    <div className="mx-auto max-w-[800px] px-4 py-10 sm:px-6">
      <header className="mb-8 border-b border-sa-border pb-6">
        <h1 className="font-sans text-[28px] font-medium tracking-[-0.02em] text-sa-primary sm:text-[36px]">
          Security
        </h1>
        <p className="mt-2 text-[14px] text-sa-muted">
          Password and session management for your storefront account.
        </p>
      </header>

      <section className="mb-12">
        <h2 className="text-[14px] font-semibold uppercase tracking-[0.1em] text-sa-muted">
          Change password
        </h2>
        <form
          className="mt-4 flex max-w-md flex-col gap-4"
          onSubmit={handleSubmit(async (values) => {
            try {
              await changeCustomerPassword({
                currentPassword: values.currentPassword,
                newPassword: values.newPassword,
              });
              endSession();
              toast("Password updated. Please sign in again.", "success");
              router.push("/login");
            } catch (error) {
              toast(getUserFacingErrorMessage(error), "error");
            }
          })}
        >
          <label className="flex flex-col gap-1.5 text-[13px]">
            <span className="font-semibold text-sa-primary">Current password</span>
            <input
              type="password"
              autoComplete="current-password"
              className="h-11 border border-sa-input bg-surface px-3 text-sa-primary outline-none focus:border-terra"
              {...register("currentPassword")}
            />
            {errors.currentPassword ? (
              <span className="text-red-600">{errors.currentPassword.message}</span>
            ) : null}
          </label>
          <label className="flex flex-col gap-1.5 text-[13px]">
            <span className="font-semibold text-sa-primary">New password</span>
            <input
              type="password"
              autoComplete="new-password"
              className="h-11 border border-sa-input bg-surface px-3 text-sa-primary outline-none focus:border-terra"
              {...register("newPassword")}
            />
            {errors.newPassword ? (
              <span className="text-red-600">{errors.newPassword.message}</span>
            ) : null}
          </label>
          <label className="flex flex-col gap-1.5 text-[13px]">
            <span className="font-semibold text-sa-primary">Confirm password</span>
            <input
              type="password"
              autoComplete="new-password"
              className="h-11 border border-sa-input bg-surface px-3 text-sa-primary outline-none focus:border-terra"
              {...register("confirmPassword")}
            />
            {errors.confirmPassword ? (
              <span className="text-red-600">{errors.confirmPassword.message}</span>
            ) : null}
          </label>
          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 h-[42px] cursor-pointer bg-terra px-6 text-[12px] font-semibold uppercase tracking-[0.1em] text-white hover:bg-[#a25e48] disabled:opacity-50"
          >
            Update password
          </button>
        </form>
      </section>

      <section>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-[14px] font-semibold uppercase tracking-[0.1em] text-sa-muted">
            Active sessions
          </h2>
          <button
            type="button"
            className="cursor-pointer text-[12px] font-semibold uppercase tracking-[0.08em] text-terra hover:opacity-80"
            onClick={async () => {
              try {
                await performLogoutAll();
                toast("Signed out everywhere", "success");
                router.push("/login");
              } catch (error) {
                toast(getUserFacingErrorMessage(error), "error");
              }
            }}
          >
            Sign out all devices
          </button>
        </div>

        {isLoading ? (
          <PageLoading label="Loading sessions…" />
        ) : (
          <ul className="mt-4 divide-y divide-sa-border border border-sa-border">
            {(sessions ?? []).map((session) => (
              <li
                key={session.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-4"
              >
                <div>
                  <p className="text-[14px] font-medium text-sa-primary">
                    {session.deviceName || session.browser || "Session"}
                    {session.current ? (
                      <span className="ml-2 text-[11px] font-semibold uppercase tracking-wide text-gold">
                        Current
                      </span>
                    ) : null}
                  </p>
                  <p className="mt-1 text-[12px] text-sa-muted">
                    {[session.os, session.city, session.countryCode]
                      .filter(Boolean)
                      .join(" · ") || "Unknown device"}
                  </p>
                  <p className="mt-0.5 text-[11px] text-sa-muted">
                    Last seen:{" "}
                    {session.lastSeenAt
                      ? new Date(session.lastSeenAt).toLocaleString()
                      : "—"}
                  </p>
                </div>
                {!session.current ? (
                  <button
                    type="button"
                    disabled={revokingId === session.id}
                    className="cursor-pointer text-[12px] font-semibold uppercase tracking-[0.08em] text-sa-muted hover:text-terra disabled:opacity-50"
                    onClick={async () => {
                      setRevokingId(session.id);
                      try {
                        await revokeCustomerSession(session.id);
                        toast("Session revoked", "success");
                        await refetch();
                      } catch (error) {
                        toast(getUserFacingErrorMessage(error), "error");
                      } finally {
                        setRevokingId(null);
                      }
                    }}
                  >
                    Revoke
                  </button>
                ) : null}
              </li>
            ))}
            {(sessions ?? []).length === 0 ? (
              <li className="px-4 py-6 text-[14px] text-sa-muted">
                No sessions found.
              </li>
            ) : null}
          </ul>
        )}
      </section>
    </div>
  );
}
