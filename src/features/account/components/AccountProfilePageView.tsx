"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "@/components/ui/Toaster";
import { useCurrentUser } from "@/hooks/useCurrentUser";

import {
  accountBtnGhost,
  accountBtnPrimary,
  accountInputClass,
} from "../constants/accountForm";
import { accountContainer } from "../constants/accountLayout";
import { useUpdateCustomerMe } from "../hooks/useUpdateCustomerMe";
import {
  profileNameSchema,
  type ProfileNameFormValues,
} from "../schemas/phoneBook.schema";
import { AccountConsentsSection } from "./AccountConsentsSection";
import { AccountPageShell } from "./AccountPageShell";
import { AccountPhonesSection } from "./AccountPhonesSection";

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
      ) : onEdit ? (
        <button type="button" onClick={onEdit} className={editClass}>
          Edit
        </button>
      ) : null}
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

function NameEditor({
  onDone,
}: {
  onDone: () => void;
}) {
  const user = useCurrentUser();
  const updateMe = useUpdateCustomerMe();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileNameFormValues>({
    resolver: zodResolver(profileNameSchema),
    defaultValues: {
      firstName: user?.firstName ?? "",
      lastName: user?.lastName ?? "",
    },
  });

  return (
    <form
      className="border-b border-sa-border py-5"
      onSubmit={handleSubmit(async (values) => {
        await updateMe.unwrap({
          firstName: values.firstName.trim(),
          lastName: values.lastName?.trim() || undefined,
        });
        onDone();
      })}
    >
      <p className="text-[13px] font-semibold text-sa-primary">Name</p>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div>
          <input
            className={accountInputClass}
            placeholder="First name"
            {...register("firstName")}
          />
          {errors.firstName ? (
            <p className="mt-1 text-[11px] text-red-600">
              {errors.firstName.message}
            </p>
          ) : null}
        </div>
        <input
          className={accountInputClass}
          placeholder="Last name"
          {...register("lastName")}
        />
      </div>
      <div className="mt-3 flex gap-3">
        <button
          type="submit"
          className={accountBtnPrimary}
          disabled={updateMe.isPending}
        >
          {updateMe.isPending ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          className={accountBtnGhost}
          onClick={onDone}
          disabled={updateMe.isPending}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function ProfileContent() {
  const user = useCurrentUser();
  const [editingName, setEditingName] = useState(false);
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
            {editingName ? (
              <NameEditor onDone={() => setEditingName(false)} />
            ) : (
              <DetailRow
                label="Name"
                value={displayName}
                onEdit={() => setEditingName(true)}
              />
            )}
            <DetailRow label="Email" value={email} />
            <DetailRow
              label="Password"
              value="••••••••••••"
              editHref="/account/security"
            />
          </div>
          <AccountPhonesSection />
          <div className="border-b border-sa-border py-5">
            <p className="text-[13px] font-semibold text-sa-primary">Reviews</p>
            <p className="mt-1 text-[15px] text-sa-secondary">
              View pending and published product reviews.
            </p>
            <Link
              href="/account/reviews"
              className="mt-2 inline-block text-[13px] font-semibold text-terra hover:underline"
            >
              Manage reviews
            </Link>
          </div>
          <div className="border-b border-sa-border py-5">
            <p className="text-[13px] font-semibold text-sa-primary">
              Returns & exchanges
            </p>
            <p className="mt-1 text-[15px] text-sa-secondary">
              Track return and exchange requests for your orders.
            </p>
            <Link
              href="/account/returns"
              className="mt-2 inline-block text-[13px] font-semibold text-terra hover:underline"
            >
              View requests
            </Link>
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
          Manage addresses
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
        <AccountConsentsSection />
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
