"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { cartSnapshotFromLines } from "@/features/cart/utils/insiderCartItem";
import { env } from "@/lib/config/env";
import {
  consumeHeadInsiderInit,
  insiderCartPage,
  insiderCheckoutPage,
  insiderHomePage,
  insiderListingPage,
  insiderOtherPage,
  startInsiderSdk,
} from "@/lib/insider";
import { useCartStore } from "@/stores/useCartStore";

/**
 * Replay queued calls after ins.js loads, then send one page type + init
 * per SPA route. PDP product+init lives in ProductDetailPageView — skip here.
 */
export function InsiderScripts() {
  const pathname = usePathname();
  const lines = useCartStore((s) => s.lines);
  const totals = useCartStore((s) => s.totals);
  const localSubtotal = useCartStore((s) => s.subtotal());
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
    if (isProductDetail(pathname) || isCart(pathname)) return;
    if (isConfirmation(pathname)) return;
    if (consumeHeadInsiderInit(pathname)) return;

    if (isHome(pathname)) {
      insiderHomePage();
      return;
    }
    if (isListing(pathname)) {
      insiderListingPage({ taxonomy: listingTaxonomy(pathname) });
      return;
    }
    if (isCheckoutFlow(pathname)) {
      insiderCheckoutPage();
      return;
    }
    insiderOtherPage();
  }, [pathname]);

  useEffect(() => {
    if (!env.insider.enabled || !env.insider.accountId) return;
    if (!isCart(pathname) || !cartHydrated) return;
    insiderCartPage(
      cartSnapshotFromLines(lines, totals?.total ?? localSubtotal),
    );
  }, [pathname, lines, totals, localSubtotal, cartHydrated]);

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

function listingTaxonomy(pathname: string): string | undefined {
  const parts = pathSegments(pathname);
  if (parts[0] === "products") return "products";
  if (parts[0] === "search") return "search";
  if (parts[0] === "collections") {
    return parts[1] ? decodeURIComponent(parts[1]) : "collections";
  }
  return undefined;
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
