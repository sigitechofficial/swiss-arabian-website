"use client";

import { LocaleLink } from "@/lib/i18n/LocaleLink";
import { useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "@/components/ui/Toaster";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { formErrorText } from "@/lib/i18n/formErrors";
import type { Translator } from "@/lib/i18n/messages";
import { useShopCopy } from "@/lib/i18n/useShopCopy";

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
  const t = useShopCopy();
  const editClass =
    "shrink-0 text-[12px] font-semibold text-terra hover:underline";

  return (
    <div className="flex items-start justify-between gap-4 border-b border-sa-border py-5">
      <div className="min-w-0">
        <p className="text-[12px] font-semibold text-sa-primary">{label}</p>
        <p className="mt-1 truncate text-[13.5px] text-sa-secondary">{value}</p>
      </div>
      {editHref ? (
        <LocaleLink href={editHref} className={editClass}>
          {t("account.edit")}
        </LocaleLink>
      ) : onEdit ? (
        <button type="button" onClick={onEdit} className={editClass}>
          {t("account.edit")}
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
          <h3 className="text-[13.5px] font-semibold text-sa-primary">{title}</h3>
          <div className="mt-3 border-t border-sa-border pt-3">{children}</div>
        </div>
      </div>
    </section>
  );
}

function soon(t: Translator, label: string) {
  toast(t("account.soon", { label }), "info");
}

function NameEditor({
  onDone,
}: {
  onDone: () => void;
}) {
  const t = useShopCopy();
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
      <p className="text-[12px] font-semibold text-sa-primary">{t("account.name")}</p>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div>
          <input
            className={accountInputClass}
            placeholder={t("account.firstName")}
            {...register("firstName")}
          />
          {errors.firstName ? (
            <p className="mt-1 text-[11px] text-red-600">
              {formErrorText(t, errors.firstName.message)}
            </p>
          ) : null}
        </div>
        <input
          className={accountInputClass}
          placeholder={t("account.lastName")}
          {...register("lastName")}
        />
      </div>
      <div className="mt-3 flex gap-3">
        <button
          type="submit"
          className={accountBtnPrimary}
          disabled={updateMe.isPending}
        >
          {updateMe.isPending ? t("account.saving") : t("account.save")}
        </button>
        <button
          type="button"
          className={accountBtnGhost}
          onClick={onDone}
          disabled={updateMe.isPending}
        >
          {t("account.cancel")}
        </button>
      </div>
    </form>
  );
}

function ProfileContent() {
  const t = useShopCopy();
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
          <h1 className="text-[24px] font-bold text-sa-primary">{t("account.tab.profile")}</h1>
        </div>
      </header>

      <section className={`${accountContainer} py-8`}>
        <div className={MEASURE}>
          <h2 className="text-[15px] font-semibold text-sa-primary">
            {t("account.details")}
          </h2>
          <div className="mt-2">
            {editingName ? (
              <NameEditor onDone={() => setEditingName(false)} />
            ) : (
              <DetailRow
                label={t("account.name")}
                value={displayName}
                onEdit={() => setEditingName(true)}
              />
            )}
            <DetailRow label={t("account.email")} value={email} />
            <DetailRow
              label={t("account.password")}
              value="••••••••••••"
              editHref="/account/security"
            />
          </div>
          <AccountPhonesSection />
          <div className="border-b border-sa-border py-5">
            <p className="text-[12px] font-semibold text-sa-primary">{t("pages.title.reviews")}</p>
            <p className="mt-1 text-[13.5px] text-sa-secondary">
              {t("account.reviewsText")}
            </p>
            <LocaleLink
              href="/account/reviews"
              className="mt-2 inline-block text-[12px] font-semibold text-terra hover:underline"
            >
              {t("account.manageReviews")}
            </LocaleLink>
          </div>
        </div>
      </section>

      <section className="bg-section-soft py-8">
        <div className={accountContainer}>
          <div className={MEASURE}>
            <h2 className="text-[15px] font-semibold text-sa-primary">
              {t("account.passkeys")}
            </h2>
            <p className="mt-3 text-[13px] leading-normal text-sa-secondary">
              {t("account.passkeysText")}
            </p>
            <div className="mt-8 border-t border-sa-border pt-3">
              <button
                type="button"
                onClick={() => soon(t, t("account.passkeys"))}
                className="text-[13px] font-semibold text-terra hover:underline"
              >
                {t("account.addPasskey")}
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className={`${accountContainer} py-6`}>
        <h2 className="text-[19px] font-bold text-sa-primary">
          {t("account.checkoutPrefs")}
        </h2>
      </section>

      <PrefBlock title={t("account.shippingAddresses")}>
        <LocaleLink
          href="/account/addresses"
          className="text-[13px] font-semibold text-terra hover:underline"
        >
          {t("account.manageAddresses")}
        </LocaleLink>
      </PrefBlock>

      <PrefBlock title={t("account.paymentMethods")}>
        <LocaleLink
          href="/account/payments"
          className="text-[13px] font-semibold text-terra hover:underline"
        >
          {t("account.viewPayments")}
        </LocaleLink>
      </PrefBlock>

      <PrefBlock title={t("account.commsPrefs")} soft>
        <AccountConsentsSection />
      </PrefBlock>

      <section className={`${accountContainer} py-7`}>
        <div className={MEASURE}>
          <button
            type="button"
            onClick={() => soon(t, t("account.deletion"))}
            className="text-[12px] text-sa-secondary hover:text-terra hover:underline"
          >
            {t("account.delete")}
          </button>
          <p className="mt-1 text-[12px] text-sa-secondary">
            {t("account.deleteText")}
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
