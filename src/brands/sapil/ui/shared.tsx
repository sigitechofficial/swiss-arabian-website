import type {
  AnchorHTMLAttributes,
  ComponentType,
  CSSProperties,
  ReactNode,
} from "react";

/** Join class names, skipping falsy values. */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

/** The nine v9 pastels. Nothing else should invent a tint. */
export const SAPIL_PASTELS = [
  "pink",
  "peach",
  "butter",
  "mint",
  "sky",
  "lilac",
  "sand",
  "sage",
  "lime",
] as const;
export type SapilPastel = (typeof SAPIL_PASTELS)[number];

/** A pastel name, or any CSS colour (e.g. "var(--sapil-p-mint)", "#fff"). */
export type SapilTint = SapilPastel | (string & {});

export function tintValue(tint: SapilTint): string {
  return (SAPIL_PASTELS as readonly string[]).includes(tint)
    ? `var(--sapil-p-${tint})`
    : tint;
}

/** Inline style that sets a CSS custom property (e.g. --c, --tile) from a tint. */
export function tintStyle(
  name: `--${string}`,
  tint: SapilTint | undefined,
  style?: CSSProperties,
): CSSProperties | undefined {
  if (!tint) return style;
  return { ...style, [name]: tintValue(tint) } as CSSProperties;
}

/**
 * Link renderer. Components render a plain <a> by default; pages pass next/link
 * (or a locale-aware link) so the kit stays framework-agnostic.
 */
export type SapilLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  children?: ReactNode;
};
export type SapilLinkComponent = ComponentType<SapilLinkProps>;

export function DefaultLink(props: SapilLinkProps) {
  return <a {...props} />;
}

/** "AED 63", "AED 19.75": the v9 price format (S.fmt). */
export function formatAED(n: number, currency = "AED"): string {
  const rounded = Math.round(n * 100) / 100;
  return `${currency} ${rounded.toFixed(rounded % 1 ? 2 : 0)}`;
}

/* icons used across the kit (v9 inline SVGs) */
export function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
export function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  );
}
export function CheckIcon({ strokeWidth = 2.6 }: { strokeWidth?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  );
}
export function ChevronIcon({ dir = "down" }: { dir?: "down" | "left" | "right" }) {
  const d = dir === "left" ? "m14.5 6-6 6 6 6" : dir === "right" ? "m9.5 6 6 6-6 6" : "m7 10 5 5 5-5";
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={dir === "down" ? 1.8 : 1.6} aria-hidden="true">
      <path d={d} />
    </svg>
  );
}
