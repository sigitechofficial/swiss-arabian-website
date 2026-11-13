"use client";

import { LocaleLink } from "@/lib/i18n/LocaleLink";
import type { SapilLinkProps } from "../../ui/shared";

/** Design-system `LinkComponent`: next/link in the page's language (/ar/…). */
export function SapilLocaleLink({ href, ...props }: SapilLinkProps) {
  return <LocaleLink href={href} {...props} />;
}
