"use client";

import {
  useEffect,
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
  const onChangeRef = useRef(onChange);
  const onResolvedRef = useRef(onResolved);
  onChangeRef.current = onChange;
  onResolvedRef.current = onResolved;

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
      if (parsed.address1) onChangeRef.current(parsed.address1);
      onResolvedRef.current?.(parsed);
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
