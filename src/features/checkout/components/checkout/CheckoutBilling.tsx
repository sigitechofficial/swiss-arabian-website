"use client";

import type { ChangeEvent } from "react";
import type { CountryRegionSet } from "@/features/account/data/regionsByCountry";
import { regionLabel, regionSetLabels } from "@/features/account/utils/addressDisplay";
import { useShopCopy } from "@/lib/i18n/useShopCopy";
import { PlacesAddressInput } from "@/lib/google/PlacesAddressInput";
import type { ParsedStreetAddress } from "@/lib/google/parseGooglePlace";
import { cbox, cboxBody, cboxGrid, cboxHead, fld, fldCheck, fldFull, fldHint, fldSelect } from "@/styles/checkoutChrome";
import type { AddressFields } from "../../utils/addressSnapshot";

type FieldBind = {
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
};

type CheckoutBillingProps = {
  billingSame: boolean;
  onBillingSame: (same: boolean) => void;
  billing: AddressFields;
  bind: (field: keyof AddressFields) => FieldBind;
  onAddress1: (value: string) => void;
  onPlace: (parsed: ParsedStreetAddress) => void;
  countryCode: string;
  regionSet: CountryRegionSet | null;
};

export function CheckoutBilling({
  billingSame,
  onBillingSame,
  billing,
  bind,
  onAddress1,
  onPlace,
  countryCode,
  regionSet,
}: CheckoutBillingProps) {
  const t = useShopCopy();
  const region = regionSet ? regionSetLabels(regionSet, t) : null;
  return (
    <section className={cbox}>
      <header className={cboxHead}>
        <h2>{t("checkout.form.billingTitle")}</h2>
      </header>
      <div className={cboxBody}>
        <label className={`${fldCheck} col-span-full`}>
          <input
            type="checkbox"
            id="billing-same"
            name="billingSame"
            checked={billingSame}
            onChange={(event) => onBillingSame(event.target.checked)}
          />
          <span>{t("checkout.form.billingSame")}</span>
        </label>
        {!billingSame ? (
          <div className={cboxGrid} id="billing-fields">
            <label className={fldFull}>
              <span>{t("checkout.form.billingName")}</span>
              <input type="text" name="billName" required autoComplete="billing name" {...bind("fullName")} />
            </label>
            <label className={fldFull}>
              <span>{t("checkout.form.billingAddress1")}</span>
              <PlacesAddressInput
                name="billAddr1"
                required
                minLength={3}
                placeholder={t("address.streetPlaceholder")}
                value={billing.address1}
                countryCode={countryCode}
                onChange={onAddress1}
                onResolved={onPlace}
              />
            </label>
            <label className={fldFull}>
              <span>
                {t("checkout.form.billingAddress2")} <span className={fldHint}>{t("checkout.form.optional")}</span>
              </span>
              <input type="text" name="billAddr2" autoComplete="billing address-line2" {...bind("address2")} />
            </label>
            <label className={fld}>
              <span>{t("address.city")}</span>
              <input type="text" name="billCity" required autoComplete="billing address-level2" {...bind("city")} />
            </label>
            <label className={fld}>
              <span>{region?.label ?? t("address.kind.region")}</span>
              <div className={fldSelect}>
                <select name="billEmirate" required autoComplete="billing address-level1" {...bind("emirate")}>
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
          </div>
        ) : null}
      </div>
    </section>
  );
}
