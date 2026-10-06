export const NAVBAR_VARIANTS = [
  "classic",
  "logo-center",
  "inline",
  "inline-locale",
  "split",
  "minimal",
  "underline",
] as const;

export type NavbarVariant = (typeof NAVBAR_VARIANTS)[number];

export function isNavbarVariant(value: string): value is NavbarVariant {
  return (NAVBAR_VARIANTS as readonly string[]).includes(value);
}
