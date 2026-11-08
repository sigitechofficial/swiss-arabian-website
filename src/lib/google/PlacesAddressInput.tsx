"use client";

import {
  useEffect,
  useEffectEvent,
  useRef,
  type InputHTMLAttributes,
} from "react";
import { useMapsLibrary } from "@vis.gl/react-google-maps";
import { googlePlacesEnabled } from "./GooglePlacesProvider";
import { normalizeCountryCode } from "@/features/account/data/regionsByCountry";
import {
  parseGooglePlace,
  type ParsedStreetAddress,
} from "./parseGooglePlace";

type PlacesAddressInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "onChange" | "value"
> & {
  value: string;
  onChange: (value: string) => void;
  countryCode?: string | null;
  onResolved?: (parsed: ParsedStreetAddress) => void;
};

function PlainAddressInput({
  value,
  onChange,
  countryCode: _countryCode,
  onResolved: _onResolved,
  ...rest
}: PlacesAddressInputProps) {
  return (
    <input
      {...rest}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

function GoogleAddressInput({
  value,
  onChange,
  countryCode,
  onResolved,
  ...rest
}: PlacesAddressInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const places = useMapsLibrary("places");
  const iso = normalizeCountryCode(countryCode).toLowerCase() || undefined;
  // The Places listener (bound in an effect) calls the latest callbacks.
  const emitChange = useEffectEvent((value: string) => onChange(value));
  const emitResolved = useEffectEvent(
    (parsed: Parameters<NonNullable<typeof onResolved>>[0]) => onResolved?.(parsed),
  );

  useEffect(() => {
    const input = inputRef.current;
    if (!places || !input) return;

    const autocomplete = new places.Autocomplete(input, {
      fields: ["address_components", "formatted_address", "name"],
      types: ["address"],
      ...(iso ? { componentRestrictions: { country: iso } } : {}),
    });

    const listener = autocomplete.addListener("place_changed", () => {
      const parsed = parseGooglePlace(autocomplete.getPlace());
      if (parsed.address1) emitChange(parsed.address1);
      emitResolved(parsed);
    });

    return () => {
      listener.remove();
    };
  }, [places, iso]);

  return (
    <input
      {...rest}
      ref={inputRef}
      value={value}
      autoComplete="off"
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

export function PlacesAddressInput(props: PlacesAddressInputProps) {
  if (!googlePlacesEnabled()) return <PlainAddressInput {...props} />;
  return <GoogleAddressInput {...props} />;
}
