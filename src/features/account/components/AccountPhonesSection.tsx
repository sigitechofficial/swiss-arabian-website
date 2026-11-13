"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { PhoneNumberField } from "@/components/ui/PhoneNumberField";
import { getUserFacingErrorMessage } from "@/lib/api/userFacingErrors";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { formErrorText } from "@/lib/i18n/formErrors";
import { useShopCopy } from "@/lib/i18n/useShopCopy";

import {
  accountBtnGhost,
  accountBtnPrimary,
} from "../constants/accountForm";
import { useCustomerPhones } from "../hooks/useCustomerPhones";
import {
  phoneBookSchema,
  type PhoneBookFormValues,
} from "../schemas/phoneBook.schema";

export function AccountPhonesSection() {
  const t = useShopCopy();
  const user = useCurrentUser();
  const { list, create, remove, setPrimary } = useCustomerPhones();
  const [adding, setAdding] = useState(false);

  const {
    register,
    control,
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
      <h2 className="text-[15px] font-semibold text-sa-primary">{t("account.phones")}</h2>
      <p className="mt-1 text-[12px] text-sa-secondary">
        {user?.phoneE164 ? t("account.phonesNoteNumber", { phone: user.phoneE164 }) : t("account.phonesNote")}
      </p>

      {list.isPending ? (
        <p className="mt-3 text-[12px] text-sa-secondary">{t("account.phonesLoading")}</p>
      ) : list.isError ? (
        <p className="mt-3 text-[12px] text-red-600">
          {getUserFacingErrorMessage(list.error)}
        </p>
      ) : phones.length === 0 && !adding ? (
        <p className="mt-3 text-[13px] text-sa-secondary">{t("account.phonesEmpty")}</p>
      ) : (
        <ul className="mt-3 divide-y divide-sa-border border-y border-sa-border">
          {phones.map((phone) => (
            <li
              key={phone.id}
              className="flex flex-wrap items-center justify-between gap-3 py-3"
            >
              <div>
                <p className="text-[13.5px] text-sa-primary">{phone.phoneE164}</p>
                {phone.isPrimary ? (
                  <p className="text-[12px] font-semibold text-terra">{t("account.primary")}</p>
                ) : null}
              </div>
              <div className="flex gap-3 text-[12px] font-semibold">
                {!phone.isPrimary ? (
                  <button
                    type="button"
                    className="text-terra hover:underline disabled:opacity-50"
                    disabled={busy}
                    onClick={() => void setPrimary.unwrap(phone.id)}
                  >
                    {t("account.setPrimary")}
                  </button>
                ) : null}
                <button
                  type="button"
                  className="text-sa-secondary hover:text-terra hover:underline disabled:opacity-50"
                  disabled={busy}
                  onClick={() => {
                    if (window.confirm(t("account.removePhoneConfirm"))) {
                      void remove.unwrap(phone.id);
                    }
                  }}
                >
                  {t("account.remove")}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {adding ? (
        <form
          className="mt-4 rounded-lg border border-sa-border p-4"
          onSubmit={handleSubmit(async (values) => {
            await create.unwrap({
              phone: values.phone,
              countryCode: parsePhoneNumberFromString(values.phone)?.country ?? "AE",
              isPrimary: values.isPrimary || phones.length === 0,
            });
            reset();
            setAdding(false);
          })}
        >
          <Controller
            name="phone"
            control={control}
            render={({ field }) => (
              <PhoneNumberField
                variant="account"
                id="new-phone"
                label={t("account.phoneNumber")}
                value={field.value ?? ""}
                onChange={field.onChange}
                onBlur={field.onBlur}
                error={formErrorText(t, errors.phone?.message)}
              />
            )}
          />
          <label className="mt-3 flex items-center gap-2 text-[12px] text-sa-primary">
            <input type="checkbox" {...register("isPrimary")} />
            {t("account.setAsPrimary")}
          </label>
          <div className="mt-4 flex gap-3">
            <button
              type="submit"
              className={accountBtnPrimary}
              disabled={create.isPending}
            >
              {create.isPending ? t("account.saving") : t("account.savePhone")}
            </button>
            <button
              type="button"
              className={accountBtnGhost}
              onClick={() => {
                reset();
                setAdding(false);
              }}
            >
              {t("account.cancel")}
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          className="mt-4 text-[13px] font-semibold text-terra hover:underline"
          onClick={() => setAdding(true)}
        >
          {t("account.addPhone")}
        </button>
      )}
    </div>
  );
}
