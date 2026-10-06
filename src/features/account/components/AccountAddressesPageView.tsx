"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PageLoading } from "@/components/ui/PageLoading";
import { PhoneNumberField } from "@/components/ui/PhoneNumberField";
import { getUserFacingErrorMessage } from "@/lib/api/userFacingErrors";

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
  countryNameForCode,
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
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-sa-muted">
        {label}
      </span>
      {children}
      {error ? <span className="mt-1 block text-[11px] text-red-600">{error}</span> : null}
    </label>
  );
}

function toDto(values: AddressBookFormValues): CreateCustomerAddressDto {
  const phone = values.phone?.trim();
  return {
    type: "SHIPPING",
    firstName: values.firstName?.trim() || undefined,
    lastName: values.lastName?.trim() || undefined,
    address1: values.address1.trim(),
    address2: values.address2?.trim() || undefined,
    city: values.city.trim(),
    province: values.province?.trim() || undefined,
    country: countryNameForCode(values.countryCode),
    countryCode: values.countryCode,
    phone: phone || undefined,
    isDefaultShipping: values.isDefaultShipping,
    isDefaultBilling: values.isDefaultBilling,
  };
}

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
    watch,
    formState: { errors },
  } = useForm<AddressBookFormValues>({
    resolver: zodResolver(addressBookSchema),
    defaultValues: defaults,
  });
  const [countryCode, setCountryCode] = useState(defaults.countryCode);
  const regionSet = regionsForCountry(countryCode);
  const address1 = watch("address1");

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
        {initial ? "Edit address" : "Add a new address"}
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="First name" error={errors.firstName?.message}>
          <input className={accountInputClass} autoComplete="given-name" {...register("firstName")} />
        </Field>
        <Field label="Last name" error={errors.lastName?.message}>
          <input className={accountInputClass} autoComplete="family-name" {...register("lastName")} />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Address" error={errors.address1?.message}>
            <PlacesAddressInput
              className={accountInputClass}
              placeholder="Start typing your street address"
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
          <Field label="Apartment, suite, etc. (optional)">
            <input className={accountInputClass} autoComplete="address-line2" {...register("address2")} />
          </Field>
        </div>
        <Field label="Country" error={errors.countryCode?.message}>
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
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label={regionSet?.label ?? "Region"}>
          {regionSet ? (
            <select className={accountSelectClass} autoComplete="address-level1" {...register("province")}>
              <option value="">{regionSet.placeholder}</option>
              {regionSet.regions.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>
          ) : (
            <input className={accountInputClass} autoComplete="address-level1" {...register("province")} />
          )}
        </Field>
        <Field label="City" error={errors.city?.message}>
          <input className={accountInputClass} autoComplete="address-level2" {...register("city")} />
        </Field>
        <Field label="Phone (optional)" error={errors.phone?.message}>
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
          Default shipping address
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-[13px] text-sa-primary">
          <input type="checkbox" className="size-4 accent-terra" {...register("isDefaultBilling")} />
          Default billing address
        </label>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button type="submit" className={accountBtnPrimary} disabled={submitting}>
          {submitting ? "Saving…" : "Save address"}
        </button>
        <button type="button" className={accountBtnGhost} onClick={onCancel} disabled={submitting}>
          Cancel
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
  const [confirming, setConfirming] = useState(false);
  const name =
    address.fullName?.trim() ||
    [address.firstName, address.lastName].filter(Boolean).join(" ").trim() ||
    "Address";
  const line = [address.address1, address.address2].filter(Boolean).join(", ");
  const place = [address.city, address.province].filter(Boolean).join(", ");
  const country = address.country || countryNameForCode(address.countryCode ?? "");
  const isDefault = address.isDefaultShipping || address.isDefaultBilling;

  return (
    <article
      className={`flex flex-col rounded-lg border bg-surface p-5 sm:p-6 ${
        isDefault ? "border-terra/50" : "border-sa-border"
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <p className="mr-auto text-[15px] font-semibold text-sa-primary">{name}</p>
        {address.isDefaultShipping ? (
          <span className="rounded-full bg-terra/10 px-2.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide text-terra">
            Default shipping
          </span>
        ) : null}
        {address.isDefaultBilling ? (
          <span className="rounded-full bg-section-soft px-2.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide text-sa-secondary">
            Default billing
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
            <span className="font-normal text-sa-secondary">Remove this address?</span>
            <button
              type="button"
              className="text-[#b4483f] hover:underline disabled:opacity-50"
              disabled={busy}
              onClick={onDelete}
            >
              Yes, remove
            </button>
            <button
              type="button"
              className="text-sa-secondary hover:text-sa-primary"
              onClick={() => setConfirming(false)}
            >
              Keep
            </button>
          </>
        ) : (
          <>
            <button type="button" className="text-terra hover:underline disabled:opacity-50" disabled={busy} onClick={onEdit}>
              Edit
            </button>
            {!address.isDefaultShipping || !address.isDefaultBilling ? (
              <button
                type="button"
                className="text-terra hover:underline disabled:opacity-50"
                disabled={busy}
                onClick={onDefault}
              >
                Set as default
              </button>
            ) : null}
            <button
              type="button"
              className="ml-auto text-sa-secondary hover:text-[#b4483f] disabled:opacity-50"
              disabled={busy}
              onClick={() => setConfirming(true)}
            >
              Remove
            </button>
          </>
        )}
      </div>
    </article>
  );
}

export function AccountAddressesPageView() {
  const { list, create, update, remove, setDefault } = useCustomerAddresses();
  const [mode, setMode] = useState<"idle" | "create" | string>("idle");

  const addresses = list.data ?? [];
  const busy = create.isPending || update.isPending || remove.isPending || setDefault.isPending;

  return (
    <AccountPageShell>
      <AccountPageTitle
        title="Addresses"
        subtitle="Save shipping and billing addresses for faster checkout."
      />
      <div className={`${accountContainer} pb-20`}>
        {list.isPending ? (
          <PageLoading label="Loading your addresses…" />
        ) : list.isError ? (
          <div className="rounded-lg border border-sa-border bg-section-soft px-6 py-10 text-center">
            <p className="text-[14px] text-sa-primary">We couldn’t load your addresses.</p>
            <p className="mt-1 text-[12.5px] text-sa-secondary">{getUserFacingErrorMessage(list.error)}</p>
            <button
              type="button"
              onClick={() => void list.refetch()}
              className="mt-4 text-[12.5px] font-semibold text-terra hover:underline"
            >
              Try again
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
                <p className="mt-4 text-[15px] font-semibold text-sa-primary">No saved addresses yet</p>
                <p className="mt-1 max-w-sm text-[13px] text-sa-secondary">
                  Add a delivery address and we’ll fill it in for you at checkout.
                </p>
                <button type="button" className={`${accountBtnPrimary} mt-6`} onClick={() => setMode("create")}>
                  + Add an address
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
                    Add a new address
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
