/**
 * Google Tag Manager / GA4 IDs from settings. A wrong value loads nothing (never a
 * broken or foreign tag). Empty = no analytics (local, staging until set).
 */
export function cleanGtmId(value: string | undefined | null): string | null {
  const id = (value ?? "").trim().toUpperCase();
  return /^GTM-[A-Z0-9]{4,12}$/.test(id) ? id : null;
}

export function cleanGa4Id(value: string | undefined | null): string | null {
  const id = (value ?? "").trim().toUpperCase();
  return /^G-[A-Z0-9]{4,16}$/.test(id) ? id : null;
}
