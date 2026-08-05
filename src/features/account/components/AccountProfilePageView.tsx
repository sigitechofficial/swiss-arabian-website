"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { toast } from "@/components/ui/Toaster";
import { useCurrentUser } from "@/hooks/useCurrentUser";

import { accountContainer } from "../constants/accountLayout";
import { AccountPageShell } from "./AccountPageShell";

/** Profile detail rows share the readable measure used across the Figma frame. */
const MEASURE = "w-full max-w-[860px]";

function DetailRow({
  label,
  value,
  onEdit,
  editHref,
}: {
  label: string;
  value: string;
  onEdit?: () => void;
  editHref?: string;
}) {
  const editClass =
    "shrink-0 text-[13px] font-semibold text-terra hover:underline";

  return (
    <div className="flex items-start justify-between gap-4 border-b border-sa-border py-5">
      <div className="min-w-0">
        <p className="text-[13px] font-semibold text-sa-primary">{label}</p>
        <p className="mt-1 truncate text-[15px] text-sa-secondary">{value}</p>
      </div>
      {editHref ? (
        <Link href={editHref} className={editClass}>
          Edit
        </Link>
      ) : (
        <button type="button" onClick={onEdit} className={editClass}>
          Edit
        </button>
      )}
    </div>
  );
}

function PrefBlock({
  title,
  children,
  soft,
}: {
  title: string;
  children: ReactNode;
  soft?: boolean;
}) {
  return (
    <section
      className={`border-b border-sa-border py-4 ${
        soft ? "bg-section-soft" : "bg-page"
      }`}
    >
      <div className={accountContainer}>
        <div className={MEASURE}>
          <h3 className="text-[15px] font-semibold text-sa-primary">{title}</h3>
          <div className="mt-3 border-t border-sa-border pt-3">{children}</div>
        </div>
      </div>
    </section>
  );
}

function soon(label: string) {
  toast(`${label} will be available soon.`, "info");
}

function ProfileContent() {
  const user = useCurrentUser();
  const displayName =
    user?.fullName?.trim() ||
    [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
    "—";
  const email = user?.email?.trim() || "—";

  return (
    <>
      <header className="border-b border-sa-border py-6">
        <div className={accountContainer}>
          <h1 className="text-[28px] font-bold text-sa-primary">Profile</h1>
        </div>
      </header>

      <section className={`${accountContainer} py-8`}>
        <div className={MEASURE}>
          <h2 className="text-[17px] font-semibold text-sa-primary">
            Account Details
          </h2>
          <div className="mt-2">
            <DetailRow
              label="Name"
              value={displayName}
              onEdit={() => soon("Name editing")}
            />
            <DetailRow
              label="Email"
              value={email}
              onEdit={() => soon("Email editing")}
            />
            <DetailRow
              label="Password"
              value="••••••••••••"
              editHref="/account/security"
            />
          </div>
        </div>
      </section>

      <section className="bg-section-soft py-8">
        <div className={accountContainer}>
          <div className={MEASURE}>
            <h2 className="text-[17px] font-semibold text-sa-primary">
              Passkeys
            </h2>
            <p className="mt-3 text-[14px] leading-normal text-sa-secondary">
              Passkeys are an easier and more secure alternative to passwords.
              They let you sign in with just your fingerprint, face scan or
              screen lock.
            </p>
            <div className="mt-8 border-t border-sa-border pt-3">
              <button
                type="button"
                onClick={() => soon("Passkeys")}
                className="text-[14px] font-semibold text-terra hover:underline"
              >
                + Add a passkey
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className={`${accountContainer} py-6`}>
        <h2 className="text-[22px] font-bold text-sa-primary">
          Checkout preferences
        </h2>
      </section>

      <PrefBlock title="Shipping addresses">
        <Link
          href="/account/addresses"
          className="text-[14px] font-semibold text-terra hover:underline"
        >
          + Add a shipping address
        </Link>
      </PrefBlock>

      <PrefBlock title="Payment methods">
        <Link
          href="/account/payments"
          className="text-[14px] font-semibold text-terra hover:underline"
        >
          + Add a payment method
        </Link>
      </PrefBlock>

      <PrefBlock title="Communication preferences" soft>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <p className="max-w-[660px] text-[13px] text-sa-secondary">
            Manage how Swiss Arabian communicates with you — offers, order
            updates and more.
          </p>
          <button
            type="button"
            onClick={() => soon("Communication preferences")}
            className="shrink-0 text-[13px] font-semibold text-terra hover:underline"
          >
            Manage →
          </button>
        </div>
      </PrefBlock>

      <section className={`${accountContainer} py-7`}>
        <div className={MEASURE}>
          <button
            type="button"
            onClick={() => soon("Account deletion")}
            className="text-[13px] text-sa-secondary hover:text-terra hover:underline"
          >
            Delete account
          </button>
          <p className="mt-1 text-[12px] text-sa-secondary">
            Permanently remove your Swiss Arabian account and data.
          </p>
        </div>
      </section>
    </>
  );
}

/** Profile — Figma 1230:9413 */
export function AccountProfilePageView() {
  return (
    <AccountPageShell>
      <ProfileContent />
    </AccountPageShell>
  );
}
