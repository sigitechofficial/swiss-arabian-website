import { isHomePath } from "./homePath";

/**
 * Where the market's SEO text block (set for the home page) is shown: on the
 * home page only. SEO audit p6: every page needs its own text, so other pages
 * show only their own block (a collection's SEO text) or none, never a copy of
 * the home page's text.
 */
export function showsMarketSeoText(pathname: string): boolean {
  return isHomePath(pathname);
}
