"use client";

import type { ChangeEvent } from "react";
import { PhoneNumberField } from "@/components/ui/PhoneNumberField";
import type { CountryRegionSet } from "@/features/account/data/regionsByCountry";
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
}: CheckoutDeliveryProps) {
  return (
    <section className={cbox}>
      <header className={cboxHead}>
        <h2>Delivery</h2>
      </header>
      <div className={cboxGrid}>
        <label className={fldFull}>
          <span>Email</span>
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
          <span>Full name</span>
          <input
            type="text"
            name="delName"
            required
            autoComplete="name"
            placeholder="First and last name"
            {...bind("fullName")}
          />
        </label>
        <label className={fldFull}>
          <span>Phone</span>
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
          <span>Address line 1</span>
          <PlacesAddressInput
            name="delAddr1"
            required
            minLength={3}
            placeholder="Start typing your street address"
            value={shipping.address1}
            countryCode={countryCode}
            onChange={onAddress1}
            onResolved={onPlace}
          />
        </label>
        <label className={fldFull}>
          <span>
            Address line 2 <span className={fldHint}>(optional)</span>
          </span>
          <input
            type="text"
            name="delAddr2"
            autoComplete="address-line2"
            placeholder="Apartment, suite, floor"
            {...bind("address2")}
          />
        </label>
        <label className={fld}>
          <span>City</span>
          <input type="text" name="delCity" required autoComplete="address-level2" {...bind("city")} />
        </label>
        <label className={fld}>
          <span>{regionSet?.label ?? "Region"}</span>
          <div className={fldSelect}>
            <select name="delEmirate" required autoComplete="address-level1" {...bind("emirate")}>
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
        <label className={fldFull}>
          <span>
            Postal code <span className={fldHint}>(optional)</span>
          </span>
          <input
            type="text"
            name="delPostal"
            autoComplete="postal-code"
            inputMode="numeric"
            {...bind("postalCode")}
          />
        </label>
      </div>
    </section>
  );
}
