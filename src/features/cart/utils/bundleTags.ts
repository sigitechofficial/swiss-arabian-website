/**
 * A bundle line label from the promotion snapshot ("Bundle of 3 · 20% off")
 * split into tags. Parts that carry the saving ("%", "off") are emphasised.
 */
export type BundleTag = { text: string; strong: boolean };

export function bundleTags(label: string | null | undefined): BundleTag[] {
  if (!label) return [];
  return label
    .split("·")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((text) => ({ text, strong: /%|off/i.test(text) }));
}
