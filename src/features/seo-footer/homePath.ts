/** The home page ("/" or "/ar"), where the SEO text heading is the page's H1. */
export function isHomePath(pathname: string): boolean {
  const path = pathname.replace(/\/+$/, "") || "/";
  return path === "/" || path === "/ar";
}
