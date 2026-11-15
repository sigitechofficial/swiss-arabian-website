"use client";

import { useEffect, useRef, useState } from "react";
import type { PaymentMethodOption } from "../types/checkout";
import type { InlinePaymentSession } from "../utils/startPayment";
import { isStripePaymentMethod } from "../utils/methodLabels";
import { defaultRowKey, paymentGroups, type PayRow } from "../utils/paymentOptions";
import type { TabbyLang } from "../utils/tabby";
import type { TabbyPrescore } from "./useTabbyPrescore";

/**
 * The payment step's choices: rows for each zone method (Stripe and Paymob
 * split into wallet / card surfaces), the active row, whether its card form
 * opens in the page, and the "pay now" guard against double submits.
 */
export function usePaymentOptions(input: {
  methods: PaymentMethodOption[];
  countryCode?: string | null;
  selectedId: string | null;
  submitting: boolean;
  amountPayable?: number | null;
  inlinePayment?: InlinePaymentSession | null;
  onSelect: (id: string) => void | Promise<void>;
  onPayNow?: () => void;
  tabbyPrescore?: TabbyPrescore;
  tabbyLang?: TabbyLang;
}) {
  const {
    methods,
    countryCode,
    selectedId,
    submitting,
    amountPayable,
    inlinePayment = null,
    onSelect,
    onPayNow = () => undefined,
    tabbyPrescore = { state: "idle" },
    tabbyLang = "en",
  } = input;
  const covered = amountPayable === 0;
  const opening = useRef(false);
  const [optionKey, setOptionKey] = useState<string | null>(null);
  const groups = paymentGroups(methods, countryCode, tabbyPrescore, tabbyLang);
  const rows = groups.flatMap((group) => group.rows);
  const selected = methods.find((method) => method.zonePaymentMethodId === selectedId) ?? null;
  const fallbackKey = selected ? defaultRowKey(selected) : null;
  // The shopper's option applies while it belongs to the selected method;
  // otherwise the selected method's default option is active.
  const chosenRow = rows.find((row) => row.key === optionKey);
  const activeKey =
    chosenRow && (!selected || chosenRow.zoneId === selected.zonePaymentMethodId) ? optionKey : fallbackKey;
  const activeRow = rows.find((row) => row.key === activeKey) ?? null;
  const selectedOpensHere = Boolean(
    activeRow?.surface &&
      activeRow.provider === "paymob" &&
      selected &&
      selected.zonePaymentMethodId === activeRow.zoneId &&
      selected.providerCode?.toLowerCase() === "paymob",
  );

  useEffect(() => {
    if (!submitting && !inlinePayment) opening.current = false;
  }, [submitting, inlinePayment]);

  function payNow() {
    if (submitting || opening.current) return;
    opening.current = true;
    onPayNow();
    window.setTimeout(() => {
      opening.current = false;
    }, 0);
  }

  function pick(row: PayRow) {
    if (row.disabled) return;
    setOptionKey(row.key);
    if (row.zoneId && row.zoneId !== selectedId) void onSelect(row.zoneId);
  }

  /** The provider's card / wallet form for this row is ready to mount. */
  const formReady = (row: PayRow) =>
    Boolean(
      row.key === activeKey &&
        row.surface &&
        inlinePayment &&
        ((row.provider === "stripe" && inlinePayment.provider === "stripe") ||
          (row.provider === "paymob" && inlinePayment.provider === "paymob")),
    );

  // The page's own submit button is hidden while a provider form takes over paying.
  const hideSubmit =
    !covered &&
    (Boolean(inlinePayment) || selectedOpensHere || Boolean(selected && isStripePaymentMethod(selected)));

  return {
    covered,
    groups,
    rows,
    selected,
    activeKey,
    activeRow,
    selectedOpensHere,
    formReady,
    hideSubmit,
    pick,
    payNow,
  };
}
