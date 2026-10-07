"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  cartSnapshotFromLines,
  quotedCartShipping,
  quotedCartTotal,
} from "@/features/cart/utils/insiderCartItem";
import { env } from "@/lib/config/env";
import { DEFAULT_LANGUAGE_CODE } from "@/lib/storefront/context";
import {
  beginInsiderRouteFlush,
  insiderCheckoutPage,
  insiderHomePage,
  insiderInit,
  insiderListingPage,
  insiderOtherPage,
  pushInsiderUserContext,
  startInsiderSdk,
  syncInsiderCart,
} from "@/lib/insider";
import { useAuthStore } from "@/stores/useAuthStore";
import { useCartStore } from "@/stores/useCartStore";

/**
 * Replay queued calls after ins.js loads, then send one page type + init
 * per SPA route. type:cart is only the cart page. PDP product+init lives in
 * ProductDetailPageView — skip here.
 */
export function InsiderScripts() {
  const pathname = usePathname();
  const bootstrapped = useAuthStore((s) => s.bootstrapped);
  const lines = useCartStore((s) => s.lines);
  const totals = useCartStore((s) => s.totals);
  const [cartHydrated, setCartHydrated] = useState(false);

  useEffect(() => {
    if (!env.insider.enabled || !env.insider.accountId) return;
    startInsiderSdk();
  }, []);

  useEffect(() => {
    const persist = useCartStore.persist;
    if (!persist?.hasHydrated) {
      setCartHydrated(true);
      return;
    }
    if (persist.hasHydrated()) {
      setCartHydrated(true);
      return;
    }
    return persist.onFinishHydration(() => setCartHydrated(true));
  }, []);

  useEffect(() => {
    if (!env.insider.enabled || !env.insider.accountId) return;
    if (!bootstrapped) return;
    if (isProductDetail(pathname) || isConfirmation(pathname)) return;
    if (isCart(pathname) && !cartHydrated) return;
    const routePath = window.location.pathname || pathname;
    const merchandise =
      totals?.subtotal ??
      lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
    const shipping = quotedCartShipping(merchandise, totals?.shipping);
    const snapshot = cartSnapshotFromLines(
      lines,
      quotedCartTotal({
        merchandise,
        quotedTotal: totals?.total,
        quotedShipping: totals?.shipping,
        shipping,
      }),
      shipping,
    );
    const cartPage = isCart(routePath);
    if (cartPage) syncInsiderCart(snapshot);
    if (!beginInsiderRouteFlush(routePath)) return;
    const authUser = useAuthStore.getState().user;
    pushInsiderUserContext({
      user: authUser
        ? {
            uuid: authUser.id,
            email: authUser.email,
            phone: authUser.phoneE164,
            firstName: authUser.firstName,
            lastName: authUser.lastName,
            locale: DEFAULT_LANGUAGE_CODE,
          }
        : null,
      cart: snapshot,
      skipCart: !cartPage,
    });

    if (isHome(routePath)) {
      insiderHomePage();
      return;
    }
    if (isListing(routePath)) {
      // category { breadcrumb } + init — no type:cart, no second init.
      insiderListingPage({ breadcrumb: listingBreadcrumb(routePath) });
      return;
    }
    if (isCart(routePath)) {
      // Basket `cart` is already in user context — do not push type:cart again.
      insiderInit();
      return;
    }
    if (isCheckoutFlow(routePath)) {
      insiderCheckoutPage();
      return;
    }
    insiderOtherPage(otherPageName(routePath));
  }, [pathname, cartHydrated, bootstrapped, lines, totals]);

  return null;
}

function pathSegments(pathname: string): string[] {
  return pathname.split("/").filter(Boolean);
}

function isHome(pathname: string): boolean {
  return pathname === "/";
}

function isProductDetail(pathname: string): boolean {
  const parts = pathSegments(pathname);
  return parts.length === 2 && parts[0] === "products";
}

function isListing(pathname: string): boolean {
  const parts = pathSegments(pathname);
  if (parts.length === 1 && parts[0] === "products") return true;
  if (parts[0] === "search") return true;
  if (parts[0] === "collections") return true;
  return false;
}

function listingBreadcrumb(pathname: string): string[] {
  const parts = pathSegments(pathname);
  if (parts[0] === "search") return ["Search"];
  if (parts[0] === "collections") {
    return parts[1]
      ? ["Collections", decodeURIComponent(parts[1])]
      : ["Collections"];
  }
  return ["Shop"];
}

function isCart(pathname: string): boolean {
  const parts = pathSegments(pathname);
  return parts.length === 1 && parts[0] === "cart";
}

function isConfirmation(pathname: string): boolean {
  if (pathname.startsWith("/order-confirmation")) return true;
  if (pathname.startsWith("/checkout/payment/success")) return true;
  return false;
}

function isCheckoutFlow(pathname: string): boolean {
  if (pathname === "/checkout") return true;
  if (pathname.startsWith("/checkout/payment/success")) return false;
  if (pathname.startsWith("/checkout/payment/cancel")) return false;
  return pathname.startsWith("/checkout/");
}

function otherPageName(pathname: string): string {
  if (pathname.startsWith("/account")) return "Account";
  if (pathname.startsWith("/login")) return "Login";
  if (pathname.startsWith("/register")) return "Register";
  if (pathname.startsWith("/track")) return "Order tracking";
  const first = pathSegments(pathname)[0];
  if (!first) return "Page";
  return first.charAt(0).toUpperCase() + first.slice(1);
}
