"use client";

import type { ChangeEvent } from "react";
import type { CountryRegionSet } from "@/features/account/data/regionsByCountry";
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
  return (
    <section className={cbox}>
      <header className={cboxHead}>
        <h2>Billing information</h2>
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
          <span>Same as delivery address</span>
        </label>
        {!billingSame ? (
          <div className={cboxGrid} id="billing-fields">
            <label className={fldFull}>
              <span>Billing name</span>
              <input type="text" name="billName" required autoComplete="billing name" {...bind("fullName")} />
            </label>
            <label className={fldFull}>
              <span>Billing address line 1</span>
              <PlacesAddressInput
                name="billAddr1"
                required
                minLength={3}
                placeholder="Start typing your street address"
                value={billing.address1}
                countryCode={countryCode}
                onChange={onAddress1}
                onResolved={onPlace}
              />
            </label>
            <label className={fldFull}>
              <span>
                Billing address line 2 <span className={fldHint}>(optional)</span>
              </span>
              <input type="text" name="billAddr2" autoComplete="billing address-line2" {...bind("address2")} />
            </label>
            <label className={fld}>
              <span>City</span>
              <input type="text" name="billCity" required autoComplete="billing address-level2" {...bind("city")} />
            </label>
            <label className={fld}>
              <span>{regionSet?.label ?? "Region"}</span>
              <div className={fldSelect}>
                <select name="billEmirate" required autoComplete="billing address-level1" {...bind("emirate")}>
                  <option value="">{regionSet?.placeholder ?? "Select region"}</option>
                  {(regionSet?.regions ?? []).map((region) => (
                    <option key={region} value={region}>
                      {region}
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
