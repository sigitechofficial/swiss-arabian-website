"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PageLoading } from "@/components/ui";
import { toE164Phone } from "@/features/auth/api/auth.service";
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
  UAE_EMIRATES,
  type AddressBookFormValues,
} from "../schemas/addressBook.schema";
import type {
  CreateCustomerAddressDto,
  StorefrontCustomerAddressView,
} from "../types/customerAccount";
import { AccountPageShell } from "./AccountPageShell";
import { AccountPageTitle } from "./AccountPageTitle";

function FieldLabel({ children }: { children: string }) {
  return (
    <label className="mb-1.5 block text-[12px] font-medium text-sa-muted">
      {children}
    </label>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-[11px] text-red-600">{message}</p>;
}

function toDto(values: AddressBookFormValues): CreateCustomerAddressDto {
  const country =
    ADDRESS_COUNTRIES.find((c) => c.code === values.countryCode)?.name ??
    values.countryCode;
  const phone = values.phone?.trim();
  return {
    type: "SHIPPING",
    firstName: values.firstName?.trim() || undefined,
    lastName: values.lastName?.trim() || undefined,
    address1: values.address1.trim(),
    address2: values.address2?.trim() || undefined,
    city: values.city.trim(),
    province: values.province?.trim() || undefined,
    country,
    countryCode: values.countryCode,
    phone: phone ? toE164Phone(phone) : undefined,
    isDefaultShipping: values.isDefaultShipping,
    isDefaultBilling: values.isDefaultBilling,
  };
}

function AddressForm({
  initial,
  submitting,
  onCancel,
  onSubmit,
}: {
  initial?: StorefrontCustomerAddressView;
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
    isDefaultShipping: initial?.isDefaultShipping ?? true,
    isDefaultBilling: initial?.isDefaultBilling ?? false,
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AddressBookFormValues>({
    resolver: zodResolver(addressBookSchema),
    defaultValues: defaults,
  });

  const [countryCode, setCountryCode] = useState(defaults.countryCode);

  return (
    <form
      className="border border-sa-border bg-page p-5"
      onSubmit={handleSubmit(async (values) => {
        await onSubmit(toDto(values));
      })}
    >
      <div className="mb-4 grid grid-cols-2 gap-3">
        <div>
          <FieldLabel>First name</FieldLabel>
          <input className={accountInputClass} {...register("firstName")} />
          <FieldError message={errors.firstName?.message} />
        </div>
        <div>
          <FieldLabel>Last name</FieldLabel>
          <input className={accountInputClass} {...register("lastName")} />
          <FieldError message={errors.lastName?.message} />
        </div>
      </div>
      <div className="mb-4">
        <FieldLabel>Address</FieldLabel>
        <input className={accountInputClass} {...register("address1")} />
        <FieldError message={errors.address1?.message} />
      </div>
      <div className="mb-4">
        <FieldLabel>Apartment, suite, etc. (optional)</FieldLabel>
        <input className={accountInputClass} {...register("address2")} />
      </div>
      <div className="mb-4 grid grid-cols-2 gap-3">
        <div>
          <FieldLabel>City</FieldLabel>
          <input className={accountInputClass} {...register("city")} />
          <FieldError message={errors.city?.message} />
        </div>
        <div>
          <FieldLabel>Emirate / region</FieldLabel>
          {countryCode === "AE" ? (
            <select className={accountSelectClass} {...register("province")}>
              <option value="">Select emirate</option>
              {UAE_EMIRATES.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
          ) : (
            <input className={accountInputClass} {...register("province")} />
          )}
        </div>
      </div>
      <div className="mb-4">
        <FieldLabel>Country</FieldLabel>
        <select
          className={accountSelectClass}
          {...register("countryCode", {
            onChange: (e) => setCountryCode(e.target.value),
          })}
        >
          {ADDRESS_COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </select>
        <FieldError message={errors.countryCode?.message} />
      </div>
      <div className="mb-4">
        <FieldLabel>Phone (optional)</FieldLabel>
        <input
          type="tel"
          className={accountInputClass}
          placeholder="+971501234567"
          {...register("phone")}
        />
        <FieldError message={errors.phone?.message} />
      </div>
      <label className="mb-2 flex items-center gap-2 text-[13px] text-sa-primary">
        <input type="checkbox" {...register("isDefaultShipping")} />
        Default shipping address
      </label>
      <label className="mb-5 flex items-center gap-2 text-[13px] text-sa-primary">
        <input type="checkbox" {...register("isDefaultBilling")} />
        Default billing address
      </label>
      <div className="flex flex-wrap gap-3">
        <button type="submit" className={accountBtnPrimary} disabled={submitting}>
          {submitting ? "Saving…" : "Save address"}
        </button>
        <button
          type="button"
          className={accountBtnGhost}
          onClick={onCancel}
          disabled={submitting}
        >
          Cancel
        </button>
      </div>
    </form>
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
  const name =
    address.fullName?.trim() ||
    [address.firstName, address.lastName].filter(Boolean).join(" ").trim() ||
    "Address";
  const line = [address.address1, address.address2, address.city, address.province]
    .filter(Boolean)
    .join(", ");
  const country = address.country || countryNameForCode(address.countryCode ?? "");

  return (
    <article className="border border-sa-border bg-page p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[15px] font-semibold text-sa-primary">{name}</p>
          <p className="mt-1 text-[14px] text-sa-secondary">{line}</p>
          <p className="text-[13px] text-sa-secondary">{country}</p>
          {address.phoneE164 ? (
            <p className="mt-1 text-[13px] text-sa-secondary">{address.phoneE164}</p>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-2">
            {address.isDefaultShipping ? (
              <span className="border border-sa-border px-2 py-0.5 text-[11px] font-semibold text-sa-primary">
                Default shipping
              </span>
            ) : null}
            {address.isDefaultBilling ? (
              <span className="border border-sa-border px-2 py-0.5 text-[11px] font-semibold text-sa-primary">
                Default billing
              </span>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap gap-3 text-[13px] font-semibold">
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
            className="text-terra hover:underline disabled:opacity-50"
            disabled={busy}
            onClick={onEdit}
          >
            Edit
          </button>
          <button
            type="button"
            className="text-sa-secondary hover:text-terra hover:underline disabled:opacity-50"
            disabled={busy}
            onClick={onDelete}
          >
            Remove
          </button>
        </div>
      </div>
    </article>
  );
}

export function AccountAddressesPageView() {
  const { list, create, update, remove, setDefault } = useCustomerAddresses();
  const [mode, setMode] = useState<"idle" | "create" | string>("idle");

  const addresses = useMemo(() => list.data ?? [], [list.data]);
  const busy =
    create.isPending || update.isPending || remove.isPending || setDefault.isPending;

  return (
    <AccountPageShell>
      <AccountPageTitle
        title="Addresses"
        subtitle="Save shipping and billing addresses for faster checkout."
      />
      <div className={`${accountContainer} pb-20`}>
        {list.isPending ? (
          <PageLoading label="Loading addresses…" fill />
        ) : list.isError ? (
          <p className="text-[14px] text-red-600">
            {getUserFacingErrorMessage(list.error)}
          </p>
        ) : (
          <div className="flex max-w-[860px] flex-col gap-4">
            {addresses.length === 0 && mode === "idle" ? (
              <div className="border border-sa-border bg-section-soft px-6 py-8">
                <p className="text-[14px] text-sa-secondary">
                  No saved addresses yet. Add one for faster checkout.
                </p>
              </div>
            ) : null}

            {addresses.map((address) =>
              mode === address.id ? (
                <AddressForm
                  key={address.id}
                  initial={address}
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
                  onDelete={() => {
                    if (window.confirm("Remove this address?")) {
                      void remove.unwrap(address.id);
                    }
                  }}
                  onDefault={() => {
                    void setDefault.unwrap({
                      addressId: address.id,
                      target: "both",
                    });
                  }}
                />
              ),
            )}

            {mode === "create" ? (
              <AddressForm
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
                className="self-start text-[14px] font-semibold text-terra hover:underline"
                onClick={() => setMode("create")}
              >
                + Add an address
              </button>
            )}
          </div>
        )}
      </div>
    </AccountPageShell>
  );
}
