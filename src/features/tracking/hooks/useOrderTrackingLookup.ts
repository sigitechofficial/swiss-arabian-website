"use client";

import { useEffect, useState, type FormEvent } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useLocaleRouter } from "@/lib/i18n/useLocaleRouter";
import { useQuery } from "@tanstack/react-query";
import {
  getStoredGuestOrderAccessToken,
  storeGuestOrderAccessToken,
} from "@/features/checkout/utils/checkoutSession";
import { useHydrated } from "@/hooks/useHydrated";
import { useAuthStore } from "@/stores/useAuthStore";
import { getOrderTracking, getOrderTrackingTimeline } from "../api/orderTracking.service";

export type TrackLookupError = "orderNumber" | "token";

/**
 * `/track`: find an order by its number and the tracking token from the
 * confirmation email (signed-in shoppers need no token for their own orders).
 * The token goes to the tracking page through storage, never the URL.
 */
export function useTrackLookup() {
  const router = useLocaleRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [orderNumber, setOrderNumber] = useState("");
  const [token, setToken] = useState("");
  const [error, setError] = useState<TrackLookupError | null>(null);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const number = orderNumber.trim().toUpperCase();
    if (!number) return setError("orderNumber");
    if (!isAuthenticated && !token.trim()) return setError("token");
    setError(null);
    if (token.trim()) storeGuestOrderAccessToken(number, token.trim());
    router.push(`/track/${encodeURIComponent(number)}`);
  }

  return { isAuthenticated, orderNumber, setOrderNumber, token, setToken, error, submit };
}

export type GuestTokenError = "empty" | "isOrderNumber";

/**
 * `/track/[orderNumber]`: the order's tracking summary for the signed-in owner,
 * or for a guest with the order's access token (from the email link, storage
 * or typed in). Also loads the carrier timeline once there is a shipment.
 */
export function useGuestTracking(orderNumber: string) {
  const router = useLocaleRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const hydrated = useHydrated();
  const bootstrapped = useAuthStore((s) => s.bootstrapped);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  // Email links carry the token as `?token=`. Keep it (scoped to this order)
  // and take it out of the address bar so it isn't shared or logged.
  const rawUrlToken = searchParams.get("token") ?? searchParams.get("orderAccessToken");
  const urlToken = rawUrlToken && rawUrlToken !== orderNumber ? rawUrlToken : null;
  useEffect(() => {
    if (!urlToken) return;
    storeGuestOrderAccessToken(orderNumber, urlToken);
    router.replace(pathname);
  }, [urlToken, orderNumber, pathname, router]);

  const storedToken = hydrated ? getStoredGuestOrderAccessToken(orderNumber) : null;
  const [enteredToken, setEnteredToken] = useState<string | null>(null);
  const [tokenInput, setTokenInput] = useState("");
  const [formError, setFormError] = useState<GuestTokenError | null>(null);
  const token = enteredToken ?? urlToken ?? storedToken;

  const accountQuery = useQuery({
    queryKey: ["order-tracking", orderNumber, "account"],
    queryFn: () => getOrderTracking(orderNumber),
    enabled: bootstrapped && isAuthenticated,
    retry: false,
  });

  // Guests — or signed-in shoppers tracking an order that isn't theirs.
  const guestEnabled = bootstrapped && Boolean(token) && (!isAuthenticated || accountQuery.isError);
  const guestQuery = useQuery({
    queryKey: ["order-tracking", orderNumber, "guest", token],
    queryFn: () => getOrderTracking(orderNumber, token),
    enabled: guestEnabled,
    retry: false,
  });

  // Persist a manually entered token only once it has actually worked.
  useEffect(() => {
    if (guestQuery.data && token) storeGuestOrderAccessToken(orderNumber, token);
  }, [guestQuery.data, token, orderNumber]);

  const summary = accountQuery.data ?? guestQuery.data ?? null;
  const viaGuestToken = !accountQuery.data && Boolean(guestQuery.data);
  const timelineQuery = useQuery({
    queryKey: ["order-tracking-timeline", orderNumber, viaGuestToken ? token : "account"],
    queryFn: () => getOrderTrackingTimeline(orderNumber, viaGuestToken ? token : null),
    enabled: Boolean(summary?.shipments.length),
    retry: false,
  });

  const loading =
    !hydrated ||
    !bootstrapped ||
    (isAuthenticated && accountQuery.isPending) ||
    (guestEnabled && guestQuery.isPending);

  function lookup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = tokenInput.trim();
    if (!value) return setFormError("empty");
    if (value.toUpperCase() === orderNumber.toUpperCase()) return setFormError("isOrderNumber");
    setFormError(null);
    setEnteredToken(value);
  }

  return {
    pathname,
    isAuthenticated,
    loading,
    summary,
    timeline: timelineQuery.data,
    viaGuestToken,
    token,
    /** The order is the signed-in shopper's own (link to the full order). */
    ownOrder: Boolean(accountQuery.data && summary && !summary.isGuestOrder),
    notInAccount: isAuthenticated && accountQuery.isError,
    tokenRejected: guestQuery.isError,
    tokenInput,
    setTokenInput,
    formError,
    lookup,
  };
}
