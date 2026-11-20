"use client";

import type { ChangeEvent, ReactNode } from "react";
import { PhoneNumberField } from "@/components/ui/PhoneNumberField";
import type { CountryRegionSet } from "@/features/account/data/regionsByCountry";
import { regionLabel, regionSetLabels } from "@/features/account/utils/addressDisplay";
import { useShopCopy } from "@/lib/i18n/useShopCopy";
import { PlacesAddressInput } from "@/lib/google/PlacesAddressInput";
import type { ParsedStreetAddress } from "@/lib/google/parseGooglePlace";
import { cbox, cboxGrid, cboxHead, fld, fldFull, fldHint, fldSelect } from "@/styles/checkoutChrome";
import type { AddressFields } from "../../utils/addressSnapshot";

type FieldBind = {
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
};

type CheckoutDeliveryProps = {
  email: string;
  onEmail: (value: string) => void;
  shipping: AddressFields;
  bind: (field: keyof AddressFields) => FieldBind;
  onPhone: (phone: string) => void;
  onAddress1: (value: string) => void;
  onPlace: (parsed: ParsedStreetAddress) => void;
  countryCode: string;
  regionSet: CountryRegionSet | null;
  beforeFields?: ReactNode;
};

export function CheckoutDelivery({
  email,
  onEmail,
  shipping,
  bind,
  onPhone,
  onAddress1,
  onPlace,
  countryCode,
  regionSet,
  beforeFields,
}: CheckoutDeliveryProps) {
  const t = useShopCopy();
  const region = regionSet ? regionSetLabels(regionSet, t) : null;
  return (
    <section className={cbox}>
      <header className={cboxHead}>
        <h2>{t("orders.delivery")}</h2>
      </header>
      <div className={cboxGrid}>
        {beforeFields}
        <label className={fldFull}>
          <span>{t("account.email")}</span>
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => onEmail(event.target.value)}
          />
        </label>
        <label className={fldFull}>
          <span>{t("auth.fullName")}</span>
          <input
            type="text"
            name="delName"
            required
            autoComplete="name"
            placeholder={t("checkout.form.namePlaceholder")}
            {...bind("fullName")}
          />
        </label>
        <label className={fldFull}>
          <span>{t("checkout.form.phone")}</span>
          <PhoneNumberField
            variant="checkout"
            renderLabel={false}
            id="delPhone"
            name="delPhone"
            required
            value={shipping.phone}
            onChange={onPhone}
          />
        </label>
        <label className={fldFull}>
          <span>{t("checkout.form.address1")}</span>
          <PlacesAddressInput
            name="delAddr1"
            required
            minLength={3}
            placeholder={t("address.streetPlaceholder")}
            value={shipping.address1}
            countryCode={countryCode}
            onChange={onAddress1}
            onResolved={onPlace}
          />
        </label>
        <label className={fldFull}>
          <span>
            {t("checkout.form.address2")} <span className={fldHint}>{t("checkout.form.optional")}</span>
          </span>
          <input
            type="text"
            name="delAddr2"
            autoComplete="address-line2"
            placeholder={t("checkout.form.address2Placeholder")}
            {...bind("address2")}
          />
        </label>
        <label className={fld}>
          <span>{t("address.city")}</span>
          <input type="text" name="delCity" aria-label={t("address.city")} required autoComplete="address-level2" {...bind("city")} />
        </label>
        <label className={fld}>
          <span>{region?.label ?? t("address.kind.region")}</span>
          <div className={fldSelect}>
            <select name="delEmirate" required autoComplete="address-level1" {...bind("emirate")}>
              <option value="">{region?.placeholder ?? t("address.kind.regionSelect")}</option>
              {(regionSet?.regions ?? []).map((name) => (
                <option key={name} value={name}>
                  {regionLabel(countryCode, name, t)}
                </option>
              ))}
            </select>
            <b aria-hidden="true">▾</b>
          </div>
        </label>
        <label className={fldFull}>
          <span>
            {t("checkout.form.postal")} <span className={fldHint}>{t("checkout.form.optional")}</span>
          </span>
          <input
            type="text"
            name="delPostal"
            aria-label={t("checkout.form.postalOptional")}
            autoComplete="postal-code"
            inputMode="numeric"
            {...bind("postalCode")}
          />
        </label>
      </div>
    </section>
  );
}
