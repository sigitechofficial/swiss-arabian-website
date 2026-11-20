"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/ui/Toaster";
import { useApiMutation, useApiQuery } from "@/lib/api/queryHooks";
import { getUserFacingErrorMessage } from "@/lib/api/userFacingErrors";
import { useShopCopy } from "@/lib/i18n/useShopCopy";
import { customerAccountKeys } from "../api/customerAccount.keys";
import { getCommunicationPreferences, setCommunicationPreference } from "../api/customerAccount.service";
import type { MarketingChannel } from "../types/customerAccount";

/** The section's anchor: links from emails ("Manage your preferences") land on it. */
export const COMMUNICATION_PREFERENCES_ID = "communication-preferences";

/**
 * The account's marketing switches, every brand: one per channel the platform
 * sends marketing on (from the backend, so a new channel appears by itself).
 * Each switch saves at once; what it shows is what the sender will do.
 */
export function useCommunicationPreferences() {
  const queryClient = useQueryClient();
  const t = useShopCopy();
  const query = useApiQuery(customerAccountKeys.communication(), getCommunicationPreferences);
  const save = useApiMutation(
    ({ channel, subscribed }: { channel: MarketingChannel; subscribed: boolean }) =>
      setCommunicationPreference(channel, subscribed),
    {
      onSuccess: (next, { subscribed }) => {
        queryClient.setQueryData(customerAccountKeys.communication(), next);
        toast(t(subscribed ? "account.consent.savedOn" : "account.consent.savedOff"), "success");
      },
      onError: (error) => toast(getUserFacingErrorMessage(error), "error"),
    },
  );

  // Arriving from a link to the section: it renders after the data loads, so
  // bring it into view then (the browser's own jump happened before it existed).
  const loaded = query.isSuccess;
  useEffect(() => {
    if (!loaded || window.location.hash !== `#${COMMUNICATION_PREFERENCES_ID}`) return;
    document.getElementById(COMMUNICATION_PREFERENCES_ID)?.scrollIntoView({ block: "center" });
  }, [loaded]);

  return {
    channels: query.data?.channels ?? [],
    loading: query.isPending,
    failed: query.isError,
    retry: () => void query.refetch(),
    /** The channel being saved right now (its switch waits). */
    savingChannel: save.isPending ? (save.variables?.channel ?? null) : null,
    setSubscribed: (channel: MarketingChannel, subscribed: boolean) => save.mutate({ channel, subscribed }),
  };
}
