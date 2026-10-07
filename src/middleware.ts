import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isLocaleSwitchablePath, withLocalePrefix } from "@/lib/i18n/localePath";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const isArabic = pathname === "/ar" || pathname.startsWith("/ar/");
  const languageParam = request.nextUrl.searchParams.get("languageCode");

  if (
    !isArabic &&
    languageParam &&
    languageParam.toLowerCase().startsWith("ar") &&
    isLocaleSwitchablePath(pathname)
  ) {
    const url = request.nextUrl.clone();
    url.pathname = withLocalePrefix(pathname, "ar");
    url.searchParams.delete("languageCode");
    return NextResponse.redirect(url, 301);
  }

  if (isArabic) {
    const stripped = pathname === "/ar" ? "/" : pathname.slice(3) || "/";
    const url = request.nextUrl.clone();
    url.pathname = stripped.startsWith("/") ? stripped : `/${stripped}`;
    const headers = new Headers(request.headers);
    headers.set("x-shop-locale", "ar");
    return NextResponse.rewrite(url, { request: { headers } });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
