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
import { formatPhoneNumber } from "@/components/ui/phone/usePhoneNumberField";
import { AuthOtpField } from "@/features/auth/components/AuthOtpField";
import {
  confirmPhoneVerification,
  requestPhoneVerification,
} from "@/features/auth/api/auth.service";
import type { PhoneCodeChannel } from "@/features/auth/types/auth";

type VerifyState = {
  phoneId: string;
  phoneE164: string;
  code: string;
  busy: boolean;
  error: string | null;
};

/**
 * A number is yours (sign-in, reset, staff benefits) only after you enter the
 * code we send to it. The code is checked for your account only.
 */
function usePhoneVerification(onVerified: () => void) {
  const [state, setState] = useState<VerifyState | null>(null);

  async function send(phone: { id: string; phoneE164: string }, channel?: PhoneCodeChannel) {
    setState({ phoneId: phone.id, phoneE164: phone.phoneE164, code: "", busy: true, error: null });
    try {
      await requestPhoneVerification(phone.phoneE164, channel);
      setState((current) => (current ? { ...current, busy: false } : current));
    } catch (error) {
      setState((current) =>
        current ? { ...current, busy: false, error: getUserFacingErrorMessage(error) } : current,
      );
    }
  }

  async function confirm() {
    if (!state || !/^\d{6}$/.test(state.code)) return;
    setState({ ...state, busy: true, error: null });
    try {
      await confirmPhoneVerification(state.phoneE164, state.code);
      setState(null);
      onVerified();
    } catch (error) {
      setState({ ...state, busy: false, error: getUserFacingErrorMessage(error) });
    }
  }

  return {
    state,
    send,
    confirm,
    setCode: (code: string) => setState((current) => (current ? { ...current, code } : current)),
    cancel: () => setState(null),
  };
}

export function AccountPhonesSection() {
  const t = useShopCopy();
  const user = useCurrentUser();
  const { list, create, remove, setPrimary } = useCustomerPhones();
  const [adding, setAdding] = useState(false);
  const verification = usePhoneVerification(() => void list.refetch());

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
                <p className="text-[13.5px] text-sa-primary" dir="ltr">{formatPhoneNumber(phone.phoneE164)}</p>
                {phone.isPrimary ? (
                  <p className="text-[12px] font-semibold text-terra">{t("account.primary")}</p>
                ) : null}
                <p className="text-[12px] text-sa-secondary">
                  {phone.isVerified ? t("account.phoneVerified") : t("account.phoneNotVerified")}
                </p>
                {verification.state?.phoneId === phone.id ? (
                  <div className="mt-3 flex flex-col gap-2">
                    <AuthOtpField
                      id={`verify-${phone.id}`}
                      label={t("account.verifyPhoneCode")}
                      value={verification.state.code}
                      onChange={verification.setCode}
                      error={verification.state.error ?? undefined}
                    />
                    <div className="flex flex-wrap gap-3 text-[12px] font-semibold">
                      <button
                        type="button"
                        className="text-terra hover:underline disabled:opacity-50"
                        disabled={verification.state.busy}
                        onClick={() => void verification.confirm()}
                      >
                        {t("account.verifyPhoneConfirm")}
                      </button>
                      <button
                        type="button"
                        className="text-sa-secondary hover:underline disabled:opacity-50"
                        disabled={verification.state.busy}
                        onClick={() => void verification.send(phone, "WHATSAPP")}
                      >
                        {t("account.verifyPhoneByWhatsApp")}
                      </button>
                      <button type="button" className="text-sa-secondary hover:underline" onClick={verification.cancel}>
                        {t("account.cancel")}
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
              <div className="flex gap-3 text-[12px] font-semibold">
                {!phone.isVerified && verification.state?.phoneId !== phone.id ? (
                  <button
                    type="button"
                    className="text-terra hover:underline disabled:opacity-50"
                    disabled={busy}
                    onClick={() => void verification.send(phone)}
                  >
                    {t("account.verifyPhone")}
                  </button>
                ) : null}
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
          noValidate
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
