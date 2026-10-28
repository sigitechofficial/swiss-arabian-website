"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ApiClientError } from "@/lib/api/apiError";
import { requestOmnichannelRefresh, type LoyaltyMarketQuery } from "../api/loyalty.service";
import type { LoyaltyActivityPageView, LoyaltyWalletView } from "../types/loyalty";
import {
  captureOmnichannelRefreshSnapshot,
  OMNICHANNEL_COPY,
  OMNICHANNEL_REFRESH_POLL_AT_MS,
  omnichannelRefreshObserved,
  omnichannelRefreshUi,
  type OmnichannelLoyaltyView,
} from "../types/omnichannel";

export type OmnichannelRefreshPhase =
  | "idle"
  | "refreshing"
  | "throttled"
  | "not_ready"
  | "disabled"
  | "failed"
  | "updated";

type RunSignal = { cancelled: boolean; timers: number[] };

function sleep(ms: number, signal: RunSignal) {
  return new Promise<void>((resolve) => {
    const id = window.setTimeout(resolve, ms);
    signal.timers.push(id);
  });
}

export function useOmnichannelRefresh(input: {
  omnichannel: OmnichannelLoyaltyView | null;
  market: LoyaltyMarketQuery | null;
  activityLoaded: boolean;
  lastTransactionImportSuccessAt: string | null;
  refetchWallet: () => Promise<LoyaltyWalletView | undefined>;
  refetchTransactions: () => Promise<LoyaltyActivityPageView | undefined>;
}) {
  const [phase, setPhase] = useState<OmnichannelRefreshPhase>("idle");
  const [postCooling, setPostCooling] = useState(false);
  const runRef = useRef<RunSignal>({ cancelled: false, timers: [] });

  const server = omnichannelRefreshUi(input.omnichannel);
  const busy = phase === "refreshing";
  const visible = busy || server.visible;
  const disabled =
    busy ||
    postCooling ||
    server.cooling ||
    !server.clickable ||
    phase === "not_ready" ||
    phase === "disabled";

  const stopRun = useCallback(() => {
    runRef.current.cancelled = true;
    for (const id of runRef.current.timers) window.clearTimeout(id);
    runRef.current = { cancelled: true, timers: [] };
  }, []);

  useEffect(() => () => stopRun(), [stopRun]);

  const refetchWallet = input.refetchWallet;

  useEffect(() => {
    if (busy || !server.cooling || server.retryAfterSeconds == null) return;
    const ms = Math.max(1, server.retryAfterSeconds) * 1000;
    const id = window.setTimeout(() => {
      void refetchWallet();
    }, ms);
    return () => window.clearTimeout(id);
  }, [busy, refetchWallet, server.cooling, server.retryAfterSeconds]);

  const showCooldownCopy =
    phase !== "disabled" &&
    phase !== "not_ready" &&
    (phase === "throttled" || postCooling || server.reason === "COOLDOWN");

  const displayMessage =
    phase === "failed"
      ? OMNICHANNEL_COPY.refreshFailed
      : phase === "updated"
        ? OMNICHANNEL_COPY.updated
        : phase === "not_ready"
          ? OMNICHANNEL_COPY.notReady
          : showCooldownCopy
            ? OMNICHANNEL_COPY.throttled
            : null;

  const poll = useCallback(
    async (
      signal: RunSignal,
      snapshot: NonNullable<ReturnType<typeof captureOmnichannelRefreshSnapshot>>,
    ) => {
      let elapsed = 0;
      for (const at of OMNICHANNEL_REFRESH_POLL_AT_MS) {
        const wait = at - elapsed;
        elapsed = at;
        if (wait > 0) await sleep(wait, signal);
        if (signal.cancelled) return;
        const wallet = await input.refetchWallet();
        const activity = await input.refetchTransactions();
        if (signal.cancelled) return;
        const after = captureOmnichannelRefreshSnapshot(
          wallet?.omnichannel ?? null,
          activity?.lastTransactionImportSuccessAt ?? null,
        );
        if (after && omnichannelRefreshObserved(snapshot, after)) {
          setPhase("updated");
          return;
        }
      }
      setPhase("idle");
    },
    [input],
  );

  const refresh = useCallback(async () => {
    if (!input.market || !visible || disabled) return;
    stopRun();
    const signal: RunSignal = { cancelled: false, timers: [] };
    runRef.current = signal;
    const snapshot = captureOmnichannelRefreshSnapshot(
      input.omnichannel,
      input.lastTransactionImportSuccessAt,
    );
    setPostCooling(false);
    setPhase("refreshing");
    try {
      const result = await requestOmnichannelRefresh(input.market);
      if (signal.cancelled) return;
      if (result.status === "QUEUED" || result.status === "ALREADY_QUEUED") {
        if (!snapshot) {
          setPhase("idle");
          return;
        }
        await poll(signal, snapshot);
        return;
      }
      if (result.status === "THROTTLED") {
        setPhase("throttled");
        setPostCooling(true);
        const waitMs = Math.max(1, result.retryAfterSeconds ?? 30) * 1000;
        const id = window.setTimeout(() => {
          if (!signal.cancelled) {
            setPhase("idle");
            setPostCooling(false);
            void input.refetchWallet();
          }
        }, waitMs);
        signal.timers.push(id);
        return;
      }
      if (result.status === "DISABLED") {
        setPostCooling(false);
        setPhase("disabled");
        await input.refetchWallet();
        if (!signal.cancelled) setPhase("idle");
        return;
      }
      setPostCooling(false);
      setPhase("not_ready");
      await input.refetchWallet();
    } catch (error) {
      if (signal.cancelled) return;
      if (error instanceof ApiClientError && error.status === 401) {
        return;
      }
      setPhase("failed");
    }
  }, [disabled, input, poll, stopRun, visible]);

  return {
    visible,
    busy,
    disabled,
    phase,
    message: displayMessage,
    refresh,
  };
}
