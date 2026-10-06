export type ParsedStreetAddress = {
  address1: string;
  address2: string;
  city: string;
  province: string;
  countryCode: string;
  postalCode: string;
};

function component(
  place: google.maps.places.PlaceResult,
  type: string,
  short = false,
): string {
  const entry = place.address_components?.find((item) => item.types.includes(type));
  if (!entry) return "";
  return (short ? entry.short_name : entry.long_name)?.trim() || "";
}

/** Map a Google Place into storefront address fields (street vs city vs region). */
export function parseGooglePlace(
  place: google.maps.places.PlaceResult,
): ParsedStreetAddress {
  const streetNumber = component(place, "street_number");
  const route = component(place, "route");
  const premise = component(place, "premise");
  const subpremise = component(place, "subpremise");
  const street = [streetNumber, route].filter(Boolean).join(" ");

  return {
    address1: street || premise || place.name?.trim() || "",
    address2: subpremise,
    city:
      component(place, "locality") ||
      component(place, "postal_town") ||
      component(place, "sublocality_level_1") ||
      component(place, "administrative_area_level_2"),
    province:
      component(place, "administrative_area_level_1") ||
      component(place, "administrative_area_level_2") ||
      component(place, "locality"),
    countryCode: component(place, "country", true).toUpperCase(),
    postalCode: component(place, "postal_code"),
  };
}
