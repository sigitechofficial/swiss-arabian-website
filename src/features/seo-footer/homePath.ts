import { stripLocalePrefix } from "@/lib/i18n/localePath";

/** The home page ("/", "/ar" …), where the SEO text heading is the page's H1. */
export function isHomePath(pathname: string): boolean {
  const path = pathname.replace(/\/+$/, "") || "/";
  return stripLocalePrefix(path) === "/";
}
