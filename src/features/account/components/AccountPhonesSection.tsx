"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toE164Phone } from "@/features/auth/api/auth.service";
import { getUserFacingErrorMessage } from "@/lib/api/userFacingErrors";
import { useCurrentUser } from "@/hooks/useCurrentUser";

import {
  accountBtnGhost,
  accountBtnPrimary,
  accountInputClass,
} from "../constants/accountForm";
import { useCustomerPhones } from "../hooks/useCustomerPhones";
import {
  phoneBookSchema,
  type PhoneBookFormValues,
} from "../schemas/phoneBook.schema";

export function AccountPhonesSection() {
  const user = useCurrentUser();
  const { list, create, remove, setPrimary } = useCustomerPhones();
  const [adding, setAdding] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PhoneBookFormValues>({
    resolver: zodResolver(phoneBookSchema),
    defaultValues: { phone: "", isPrimary: false },
  });

  const phones = list.data ?? [];
  const busy = create.isPending || remove.isPending || setPrimary.isPending;

  return (
    <div className="mt-8">
      <h2 className="text-[17px] font-semibold text-sa-primary">Phones</h2>
      <p className="mt-1 text-[13px] text-sa-secondary">
        Primary phone is used on your profile
        {user?.phoneE164 ? ` (${user.phoneE164})` : ""}.
      </p>

      {list.isPending ? (
        <p className="mt-3 text-[13px] text-sa-secondary">Loading phones…</p>
      ) : list.isError ? (
        <p className="mt-3 text-[13px] text-red-600">
          {getUserFacingErrorMessage(list.error)}
        </p>
      ) : phones.length === 0 && !adding ? (
        <p className="mt-3 text-[14px] text-sa-secondary">No phones saved yet.</p>
      ) : (
        <ul className="mt-3 divide-y divide-sa-border border-y border-sa-border">
          {phones.map((phone) => (
            <li
              key={phone.id}
              className="flex flex-wrap items-center justify-between gap-3 py-3"
            >
              <div>
                <p className="text-[15px] text-sa-primary">{phone.phoneE164}</p>
                {phone.isPrimary ? (
                  <p className="text-[12px] font-semibold text-terra">Primary</p>
                ) : null}
              </div>
              <div className="flex gap-3 text-[13px] font-semibold">
                {!phone.isPrimary ? (
                  <button
                    type="button"
                    className="text-terra hover:underline disabled:opacity-50"
                    disabled={busy}
                    onClick={() => void setPrimary.unwrap(phone.id)}
                  >
                    Set primary
                  </button>
                ) : null}
                <button
                  type="button"
                  className="text-sa-secondary hover:text-terra hover:underline disabled:opacity-50"
                  disabled={busy}
                  onClick={() => {
                    if (window.confirm("Remove this phone?")) {
                      void remove.unwrap(phone.id);
                    }
                  }}
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {adding ? (
        <form
          className="mt-4 border border-sa-border p-4"
          onSubmit={handleSubmit(async (values) => {
            await create.unwrap({
              phone: toE164Phone(values.phone),
              countryCode: "AE",
              isPrimary: values.isPrimary || phones.length === 0,
            });
            reset();
            setAdding(false);
          })}
        >
          <label className="mb-1.5 block text-[12px] font-medium text-sa-muted">
            Phone number
          </label>
          <input
            type="tel"
            className={accountInputClass}
            placeholder="+971501234567"
            {...register("phone")}
          />
          {errors.phone ? (
            <p className="mt-1 text-[11px] text-red-600">{errors.phone.message}</p>
          ) : null}
          <label className="mt-3 flex items-center gap-2 text-[13px] text-sa-primary">
            <input type="checkbox" {...register("isPrimary")} />
            Set as primary
          </label>
          <div className="mt-4 flex gap-3">
            <button
              type="submit"
              className={accountBtnPrimary}
              disabled={create.isPending}
            >
              {create.isPending ? "Saving…" : "Save phone"}
            </button>
            <button
              type="button"
              className={accountBtnGhost}
              onClick={() => {
                reset();
                setAdding(false);
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          className="mt-4 text-[14px] font-semibold text-terra hover:underline"
          onClick={() => setAdding(true)}
        >
          + Add a phone
        </button>
      )}
    </div>
  );
}
