"use client";

import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PageLoading } from "@/components/ui/PageLoading";
import { PhoneNumberField } from "@/components/ui/PhoneNumberField";
import { getUserFacingErrorMessage } from "@/lib/api/userFacingErrors";
import { formErrorText } from "@/lib/i18n/formErrors";
import { useShopLocale } from "@/lib/i18n/ShopLocaleProvider";
import { useShopCopy } from "@/lib/i18n/useShopCopy";

import {
  accountBtnGhost,
  accountBtnPrimary,
  accountInputClass,
  accountSelectClass,
} from "../constants/accountForm";
import { accountContainer } from "../constants/accountLayout";
import { useCustomerAddresses } from "../hooks/useCustomerAddresses";
import {
  ADDRESS_COUNTRIES,
  addressBookSchema,
  addressFormToDto,
  type AddressBookFormValues,
} from "../schemas/addressBook.schema";
import { GooglePlacesProvider } from "@/lib/google/GooglePlacesProvider";
import { PlacesAddressInput } from "@/lib/google/PlacesAddressInput";
import type { ParsedStreetAddress } from "@/lib/google/parseGooglePlace";
import { matchCountryRegion, normalizeCountryCode, regionsForCountry } from "../data/regionsByCountry";
import type {
  CreateCustomerAddressDto,
  StorefrontCustomerAddressView,
} from "../types/customerAccount";
import { countryLabel, regionLabel, regionSetLabels } from "../utils/addressDisplay";
import { AccountPageShell } from "./AccountPageShell";
import { AccountPageTitle } from "./AccountPageTitle";

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  const t = useShopCopy();
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-sa-muted">
        {label}
      </span>
      {children}
      {error ? <span className="mt-1 block text-[11px] text-red-600">{formErrorText(t, error)}</span> : null}
    </label>
  );
}

const toDto = addressFormToDto;

function AddressForm({
  initial,
  isFirst,
  submitting,
  onCancel,
  onSubmit,
}: {
  initial?: StorefrontCustomerAddressView;
  isFirst: boolean;
  submitting: boolean;
  onCancel: () => void;
  onSubmit: (dto: CreateCustomerAddressDto) => Promise<void>;
}) {
  const defaults: AddressBookFormValues = {
    firstName: initial?.firstName ?? "",
    lastName: initial?.lastName ?? "",
    address1: initial?.address1 ?? "",
    address2: initial?.address2 ?? "",
    city: initial?.city ?? "",
    province: initial?.province ?? "",
    countryCode: initial?.countryCode || "AE",
    phone: initial?.phoneE164 ?? "",
    // A first address becomes the default so checkout can prefill it.
    isDefaultShipping: initial?.isDefaultShipping ?? isFirst,
    isDefaultBilling: initial?.isDefaultBilling ?? isFirst,
  };

  const {
    register,
    control,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<AddressBookFormValues>({
    resolver: zodResolver(addressBookSchema),
    defaultValues: defaults,
  });
  const t = useShopCopy();
  const locale = useShopLocale();
  const [countryCode, setCountryCode] = useState(defaults.countryCode);
  const regionSet = regionsForCountry(countryCode);
  const regionText = regionSet ? regionSetLabels(regionSet, t) : null;
  const address1 = useWatch({ control, name: "address1" });

  return (
    <GooglePlacesProvider>
    <form
      className="rounded-lg border border-terra/40 bg-surface p-5 shadow-[0_10px_30px_-20px_rgba(140,68,53,0.5)] sm:p-6 md:col-span-2"
      onSubmit={handleSubmit(async (values) => {
        await onSubmit(toDto(values));
      })}
      noValidate
    >
      <p className="mb-5 text-[15px] font-semibold text-sa-primary">
        {initial ? t("address.edit") : t("address.addNew")}
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("account.firstName")} error={errors.firstName?.message}>
          <input className={accountInputClass} autoComplete="given-name" {...register("firstName")} />
        </Field>
        <Field label={t("account.lastName")} error={errors.lastName?.message}>
          <input className={accountInputClass} autoComplete="family-name" {...register("lastName")} />
        </Field>
        <div className="sm:col-span-2">
          <Field label={t("address.address")} error={errors.address1?.message}>
            <PlacesAddressInput
              className={accountInputClass}
              placeholder={t("address.streetPlaceholder")}
              value={address1}
              countryCode={countryCode}
              onChange={(value) =>
                setValue("address1", value, { shouldValidate: true, shouldDirty: true })
              }
              onResolved={(parsed: ParsedStreetAddress) => {
                if (parsed.address1) {
                  setValue("address1", parsed.address1, {
                    shouldValidate: true,
                    shouldDirty: true,
                  });
                }
                if (parsed.address2) {
                  setValue("address2", parsed.address2, { shouldDirty: true });
                }
                if (parsed.city) {
                  setValue("city", parsed.city, {
                    shouldValidate: true,
                    shouldDirty: true,
                  });
                }
                const googleCountry = normalizeCountryCode(parsed.countryCode);
                const nextCountry = ADDRESS_COUNTRIES.some(
                  (item) => item.code === googleCountry,
                )
                  ? googleCountry
                  : countryCode;
                if (nextCountry !== countryCode) {
                  setCountryCode(nextCountry);
                  setValue("countryCode", nextCountry, { shouldDirty: true });
                }
                const region = matchCountryRegion(
                  nextCountry,
                  parsed.province,
                  parsed.city,
                );
                if (region) {
                  setValue("province", region, { shouldDirty: true });
                }
              }}
            />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label={t("address.address2")}>
            <input className={accountInputClass} autoComplete="address-line2" {...register("address2")} />
          </Field>
        </div>
        <Field label={t("address.country")} error={errors.countryCode?.message}>
          <select
            className={accountSelectClass}
            autoComplete="country"
            {...register("countryCode", {
              onChange: (e) => {
                const next = e.target.value;
                setCountryCode(next);
                const nextSet = regionsForCountry(next);
                const current = getValues("province") ?? "";
                const stillValid = nextSet?.regions.some(
                  (region) => region.toLowerCase() === current.trim().toLowerCase(),
                );
                if (!stillValid) setValue("province", "");
              },
            })}
          >
            {ADDRESS_COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {countryLabel(c.code, locale, c.name)}
              </option>
            ))}
          </select>
        </Field>
        <Field label={regionText?.label ?? t("address.kind.region")}>
          {regionSet ? (
            <select className={accountSelectClass} autoComplete="address-level1" {...register("province")}>
              <option value="">{regionText?.placeholder}</option>
              {regionSet.regions.map((region) => (
                <option key={region} value={region}>
                  {regionLabel(countryCode, region, t)}
                </option>
              ))}
            </select>
          ) : (
            <input className={accountInputClass} autoComplete="address-level1" {...register("province")} />
          )}
        </Field>
        <Field label={t("address.city")} error={errors.city?.message}>
          <input className={accountInputClass} autoComplete="address-level2" {...register("city")} />
        </Field>
        <Field label={t("address.phoneOptional")} error={errors.phone?.message}>
          <Controller
            name="phone"
            control={control}
            render={({ field }) => (
              <PhoneNumberField
                variant="account"
                renderLabel={false}
                id="address-phone"
                value={field.value ?? ""}
                onChange={field.onChange}
                onBlur={field.onBlur}
              />
            )}
          />
        </Field>
      </div>

      <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2">
        <label className="flex cursor-pointer items-center gap-2 text-[13px] text-sa-primary">
          <input type="checkbox" className="size-4 accent-terra" {...register("isDefaultShipping")} />
          {t("address.defaultShippingAddress")}
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-[13px] text-sa-primary">
          <input type="checkbox" className="size-4 accent-terra" {...register("isDefaultBilling")} />
          {t("address.defaultBillingAddress")}
        </label>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button type="submit" className={accountBtnPrimary} disabled={submitting}>
          {submitting ? t("account.saving") : t("address.save")}
        </button>
        <button type="button" className={accountBtnGhost} onClick={onCancel} disabled={submitting}>
          {t("account.cancel")}
        </button>
      </div>
    </form>
    </GooglePlacesProvider>
  );
}

function AddressCard({
  address,
  busy,
  onEdit,
  onDelete,
  onDefault,
}: {
  address: StorefrontCustomerAddressView;
  busy: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onDefault: () => void;
}) {
  const t = useShopCopy();
  const locale = useShopLocale();
  const [confirming, setConfirming] = useState(false);
  const name =
    address.fullName?.trim() ||
    [address.firstName, address.lastName].filter(Boolean).join(" ").trim() ||
    t("address.address");
  const line = [address.address1, address.address2].filter(Boolean).join(", ");
  const province = address.province && address.countryCode ? regionLabel(address.countryCode, address.province, t) : address.province;
  const place = [address.city, province].filter(Boolean).join(", ");
  const country = countryLabel(address.countryCode, locale, address.country);
  const isDefault = address.isDefaultShipping || address.isDefaultBilling;

  return (
    <article
      className={`flex flex-col rounded-lg border bg-surface p-5 sm:p-6 ${
        isDefault ? "border-terra/50" : "border-sa-border"
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <p className="me-auto text-[15px] font-semibold text-sa-primary">{name}</p>
        {address.isDefaultShipping ? (
          <span className="rounded-full bg-terra/10 px-2.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide text-terra">
            {t("address.defaultShipping")}
          </span>
        ) : null}
        {address.isDefaultBilling ? (
          <span className="rounded-full bg-section-soft px-2.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide text-sa-secondary">
            {t("address.defaultBilling")}
          </span>
        ) : null}
      </div>

      <address className="mt-3 flex flex-1 flex-col gap-0.5 text-[13.5px] not-italic leading-relaxed text-sa-secondary">
        <span>{line}</span>
        {place ? <span>{place}</span> : null}
        {country ? <span>{country}</span> : null}
        {address.phoneE164 ? <span className="mt-1 text-sa-primary">{address.phoneE164}</span> : null}
      </address>

      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-sa-border pt-4 text-[12.5px] font-semibold">
        {confirming ? (
          <>
            <span className="font-normal text-sa-secondary">{t("address.removeConfirm")}</span>
            <button
              type="button"
              className="text-[#b4483f] hover:underline disabled:opacity-50"
              disabled={busy}
              onClick={onDelete}
            >
              {t("address.yesRemove")}
            </button>
            <button
              type="button"
              className="text-sa-secondary hover:text-sa-primary"
              onClick={() => setConfirming(false)}
            >
              {t("address.keep")}
            </button>
          </>
        ) : (
          <>
            <button type="button" className="text-terra hover:underline disabled:opacity-50" disabled={busy} onClick={onEdit}>
              {t("account.edit")}
            </button>
            {!address.isDefaultShipping || !address.isDefaultBilling ? (
              <button
                type="button"
                className="text-terra hover:underline disabled:opacity-50"
                disabled={busy}
                onClick={onDefault}
              >
                {t("address.setDefault")}
              </button>
            ) : null}
            <button
              type="button"
              className="ms-auto text-sa-secondary hover:text-[#b4483f] disabled:opacity-50"
              disabled={busy}
              onClick={() => setConfirming(true)}
            >
              {t("account.remove")}
            </button>
          </>
        )}
      </div>
    </article>
  );
}

export function AccountAddressesPageView() {
  const t = useShopCopy();
  const { list, create, update, remove, setDefault } = useCustomerAddresses();
  const [mode, setMode] = useState<"idle" | "create" | string>("idle");

  const addresses = list.data ?? [];
  const busy = create.isPending || update.isPending || remove.isPending || setDefault.isPending;

  return (
    <AccountPageShell>
      <AccountPageTitle
        title={t("pages.title.addresses")}
        subtitle={t("address.subtitle")}
      />
      <div className={`${accountContainer} pb-20`}>
        {list.isPending ? (
          <PageLoading label={t("address.loading")} />
        ) : list.isError ? (
          <div className="rounded-lg border border-sa-border bg-section-soft px-6 py-10 text-center">
            <p className="text-[14px] text-sa-primary">{t("address.loadFailed")}</p>
            <p className="mt-1 text-[12.5px] text-sa-secondary">{getUserFacingErrorMessage(list.error)}</p>
            <button
              type="button"
              onClick={() => void list.refetch()}
              className="mt-4 text-[12.5px] font-semibold text-terra hover:underline"
            >
              {t("tryAgain")}
            </button>
          </div>
        ) : (
          <>
            {addresses.length === 0 && mode === "idle" ? (
              <div className="flex flex-col items-center rounded-lg border border-dashed border-sa-border bg-surface px-6 py-14 text-center">
                <span className="flex size-14 items-center justify-center rounded-full bg-section-soft text-terra" aria-hidden="true">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M12 21s-7-6.2-7-11.5A7 7 0 0112 2.5a7 7 0 017 7C19 14.8 12 21 12 21z" />
                    <circle cx="12" cy="9.5" r="2.5" />
                  </svg>
                </span>
                <p className="mt-4 text-[15px] font-semibold text-sa-primary">{t("address.empty")}</p>
                <p className="mt-1 max-w-sm text-[13px] text-sa-secondary">
                  {t("address.emptyText")}
                </p>
                <button type="button" className={`${accountBtnPrimary} mt-6`} onClick={() => setMode("create")}>
                  {t("address.addAn")}
                </button>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {addresses.map((address) =>
                  mode === address.id ? (
                    <AddressForm
                      key={address.id}
                      initial={address}
                      isFirst={false}
                      submitting={update.isPending}
                      onCancel={() => setMode("idle")}
                      onSubmit={async (dto) => {
                        await update.unwrap({ addressId: address.id, dto });
                        setMode("idle");
                      }}
                    />
                  ) : (
                    <AddressCard
                      key={address.id}
                      address={address}
                      busy={busy}
                      onEdit={() => setMode(address.id)}
                      onDelete={() => void remove.unwrap(address.id)}
                      onDefault={() => void setDefault.unwrap({ addressId: address.id, target: "both" })}
                    />
                  ),
                )}

                {mode === "create" ? (
                  <AddressForm
                    isFirst={addresses.length === 0}
                    submitting={create.isPending}
                    onCancel={() => setMode("idle")}
                    onSubmit={async (dto) => {
                      await create.unwrap(dto);
                      setMode("idle");
                    }}
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setMode("create")}
                    disabled={mode !== "idle"}
                    className="flex min-h-[180px] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-sa-border bg-transparent text-[13px] font-semibold text-terra transition-colors hover:border-terra hover:bg-surface disabled:opacity-40"
                  >
                    <span className="text-[22px] leading-none" aria-hidden="true">+</span>
                    {t("address.addNew")}
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </AccountPageShell>
  );
}
