"use client";

import { LocaleLink } from "@/lib/i18n/LocaleLink";
import type { SapilLinkProps } from "../../ui/shared";

const EXTERNAL = /^(https?:)?\/\//i;

/**
 * Link for Sapil components (`LinkComponent`): site paths keep the page's
 * language (/ar/…), other sites open in a new tab, in-page anchors stay plain.
 */
export function SapilLink({ href, children, ...rest }: SapilLinkProps) {
  if (EXTERNAL.test(href)) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" {...rest}>
        {children}
      </a>
    );
  }
  if (href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
    return (
      <a href={href} {...rest}>
        {children}
      </a>
    );
  }
  return (
    <LocaleLink href={href} {...rest}>
      {children}
    </LocaleLink>
  );
}
