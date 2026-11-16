"use client";

import { usePathname } from "next/navigation";
import { LocaleLink } from "@/lib/i18n/LocaleLink";
import { stripLocalePrefix } from "@/lib/i18n/localePath";
import type { SapilLinkProps } from "../../ui/shared";

const EXTERNAL = /^(https?:)?\/\//i;

/**
 * The in-page anchor for a site path with a section ("/#mood") when that path is
 * the page being shown: a plain "#mood" link scrolls there without a navigation.
 * Null for any other href.
 */
export function samePageAnchor(href: string, pathname: string): string | null {
  if (!href.startsWith("/") || href.startsWith("//")) return null;
  const at = href.indexOf("#");
  if (at < 0 || at === href.length - 1) return null;
  const before = href.slice(0, at);
  if (before.includes("?")) return null;
  const path = stripLocalePrefix(before || "/") || "/";
  const current = stripLocalePrefix(pathname || "/") || "/";
  return path === current ? href.slice(at) : null;
}

/**
 * Link for Sapil components (`LinkComponent`): site paths keep the page's
 * language (/ar/…), other sites open in a new tab, in-page anchors stay plain.
 * A section of a page ("/#mood") is an in-page anchor on that page; from any
 * other page it opens the page and Next scrolls to the section (the home page
 * also scrolls there once its sections have loaded: `useScrollToLocationHash`).
 */
export function SapilLink({ href, children, ...rest }: SapilLinkProps) {
  const pathname = usePathname() || "/";
  if (EXTERNAL.test(href)) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" {...rest}>
        {children}
      </a>
    );
  }
  const anchor = href.startsWith("#") ? href : samePageAnchor(href, pathname);
  if (anchor || href.startsWith("mailto:") || href.startsWith("tel:")) {
    return (
      <a href={anchor ?? href} {...rest}>
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
