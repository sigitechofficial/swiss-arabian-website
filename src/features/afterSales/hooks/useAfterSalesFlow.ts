"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getStoredGuestOrderAccessToken } from "@/features/checkout/utils/checkoutSession";
import { useHydrated } from "@/hooks/useHydrated";
import { useShopCopy } from "@/lib/i18n/useShopCopy";
import type { AfterSalesKind, AfterSalesOption } from "../types/afterSales";
import { afterSalesErrorMessage } from "../utils/afterSalesErrors";
import {
  EMPTY_DRAFT,
  exchangeEstimateBody,
  exchangeRequestDto,
  flowSteps,
  isPickable,
  pickedLines,
  returnEstimateBody,
  returnRequestDto,
  stepComplete,
  visibleLines,
  withOnlyOptionsPicked,
  type FlowDraft,
  type FlowStep,
} from "../utils/afterSalesFlow";
import { afterSalesOptionNote } from "../utils/afterSalesOptions";
import { clearSavedFlow, readSavedFlow, saveFlow } from "../utils/flowDraftStorage";
import { useLastDayFormat } from "./useRequestDate";
import {
  useAfterSalesEligibility,
  useAfterSalesMutations,
  useCustomerAfterSalesOptions,
  useExchangeEstimate,
  useExchangeOptions,
  useGuestAfterSalesOptions,
  useReturnEstimate,
  type ReturnOrderTarget,
} from "./useAfterSales";

/** What was sent, for the confirmation step. */
export type AfterSalesFlowResult = {
  kind: AfterSalesKind;
  requestId: string;
  requestNumber: string;
  status: string;
};

export type AfterSalesChoice = {
  kind: AfterSalesKind;
  allowed: boolean;
  /** Why not, when not allowed. */
  note: string | null;
  /** Last day to ask (ISO), when known. */
  eligibleUntil: string | null;
};

/**
 * The guided return / exchange for one order, for every brand: choose what to
 * do, pick items and how many, give a reason, pick replacements (exchange),
 * review with the estimate, send. Everything the screens show comes from here;
 * the backend checks the same rules again when the request is sent.
 */
export function useAfterSalesFlow({
  target,
  locale,
  initialKind = null,
}: {
  target: ReturnOrderTarget;
  /** Language for product and size names in the exchange choices. */
  locale: string | null;
  /** Start with this choice made (e.g. from a "Request exchange" link). */
  initialKind?: AfterSalesKind | null;
}) {
  const t = useShopCopy();
  const lastDay = useLastDayFormat();
  const customer = target.mode === "customer";
  const customerOptions = useCustomerAfterSalesOptions(customer ? target.orderId : "", customer);
  const guestOptions = useGuestAfterSalesOptions(
    customer ? "" : target.orderNumber,
    customer ? null : target.orderAccessToken,
    !customer,
  );
  const options = customer ? customerOptions : guestOptions;

  // A reload keeps what the shopper put together (this tab only, per order).
  // The flow screen only renders in the browser (useAfterSalesFlowTarget waits
  // for hydration), so the saved draft can be the initial state.
  const orderRef = target.mode === "customer" ? target.orderId : target.orderNumber;
  const [restored] = useState(() => {
    const saved = readSavedFlow(orderRef);
    return saved && (!initialKind || saved.draft.kind === initialKind) ? saved : null;
  });
  const [draft, setDraft] = useState<FlowDraft>(restored?.draft ?? { ...EMPTY_DRAFT, kind: initialKind });
  const [savedStep, setStepIndex] = useState(restored?.stepIndex ?? (initialKind ? 1 : 0));
  const [result, setResult] = useState<AfterSalesFlowResult | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  useEffect(() => {
    if (result || !draft.kind) return;
    saveFlow(orderRef, { draft, stepIndex: savedStep });
  }, [draft, orderRef, result, savedStep]);

  const eligibility = useAfterSalesEligibility(target, draft.kind);
  const exchangeOptions = useExchangeOptions(target, locale, draft.kind === "exchange");
  const lines = useMemo(() => visibleLines(eligibility.data?.lines ?? []), [eligibility.data]);
  const replacementOptions = exchangeOptions.data?.lines;

  const steps = flowSteps(draft.kind);
  // Never past a step that is not complete (a restored draft, data still loading
  // or changed since): the shopper sees the first step that needs them.
  const firstIncomplete = steps.findIndex(
    (s) => s !== "review" && !stepComplete(s, draft, lines, replacementOptions),
  );
  const stepIndex = Math.min(
    savedStep,
    steps.length - 1,
    firstIncomplete >= 0 ? firstIncomplete : steps.length - 1,
  );
  const step: FlowStep = steps[stepIndex];
  const returnEstimate = useReturnEstimate(target, returnEstimateBody(draft, lines));
  const exchangeEstimate = useExchangeEstimate(target, exchangeEstimateBody(draft, lines, replacementOptions));
  const mutations = useAfterSalesMutations();

  const choices: AfterSalesChoice[] = useMemo(() => {
    const choice = (kind: AfterSalesKind, option: AfterSalesOption | undefined): AfterSalesChoice => ({
      kind,
      allowed: option?.allowed ?? false,
      note: option ? afterSalesOptionNote(option, kind, true, t, lastDay) : null,
      eligibleUntil: option?.eligibleUntil ?? null,
    });
    return [choice("return", options.data?.returns), choice("exchange", options.data?.exchanges)];
  }, [lastDay, options.data, t]);

  const update = useCallback((patch: Partial<FlowDraft>) => {
    setSubmitError(null);
    setDraft((current) => ({ ...current, ...patch }));
  }, []);

  /** Pick return or exchange; changing it starts the request over. */
  const choose = useCallback((kind: AfterSalesKind) => {
    setSubmitError(null);
    setDraft((current) => (current.kind === kind ? current : { ...EMPTY_DRAFT, kind }));
  }, []);

  const setQuantity = useCallback(
    (orderLineId: string, quantity: number) => {
      const line = lines.find((l) => l.orderLineId === orderLineId);
      if (!line || !isPickable(line)) return;
      const value = Math.max(0, Math.min(Math.floor(quantity) || 0, line.returnableQty));
      setSubmitError(null);
      setDraft((current) => ({ ...current, quantities: { ...current.quantities, [orderLineId]: value } }));
    },
    [lines],
  );

  /** Tick a line (one unit) or untick it. */
  const toggleLine = useCallback(
    (orderLineId: string, picked: boolean) => setQuantity(orderLineId, picked ? 1 : 0),
    [setQuantity],
  );

  // The market wants the free gift back with this return (giftOnReturn = MUST_RETURN):
  // the request would be refused without it, so the review step asks for it first.
  const giftRequirement = draft.kind === "return" ? returnEstimate.data?.giftRequirement : undefined;
  const giftsToAdd = useMemo(
    () =>
      giftRequirement?.required
        ? giftRequirement.gifts
            .map((gift) => gift.orderLineId)
            .filter((id) => (draft.quantities[id] ?? 0) === 0 && lines.some((line) => line.orderLineId === id && isPickable(line)))
        : [],
    [giftRequirement, draft.quantities, lines],
  );

  /** Put the free gift(s) the market needs back into the return, all units. */
  const addRequiredGifts = useCallback(() => {
    setDraft((current) => {
      const quantities = { ...current.quantities };
      for (const id of giftsToAdd) {
        const line = lines.find((l) => l.orderLineId === id);
        if (line) quantities[id] = line.returnableQty;
      }
      return { ...current, quantities };
    });
  }, [giftsToAdd, lines]);

  const complete = (s: FlowStep) => stepComplete(s, draft, lines, replacementOptions);
  const canContinue = complete(step) && !(step === "review" && giftsToAdd.length > 0);

  const next = useCallback(() => {
    if (!stepComplete(step, draft, lines, replacementOptions)) return;
    const following = steps[stepIndex + 1];
    if (following === "replacement") setDraft((current) => withOnlyOptionsPicked(current, lines, replacementOptions));
    setStepIndex(Math.min(stepIndex + 1, steps.length - 1));
  }, [draft, lines, replacementOptions, step, stepIndex, steps]);

  const back = useCallback(() => setStepIndex(Math.max(0, stepIndex - 1)), [stepIndex]);

  /** Jump back to a step already done (the step list is a way back, never forward). */
  const goTo = useCallback(
    (target: FlowStep) => {
      const index = steps.indexOf(target);
      if (index >= 0 && index < stepIndex) setStepIndex(index);
    },
    [stepIndex, steps],
  );

  const submitting =
    mutations.createReturn.isPending ||
    mutations.createExchange.isPending ||
    mutations.createGuestReturn.isPending ||
    mutations.createGuestExchange.isPending;

  const submit = useCallback(async () => {
    if (!draft.kind || !stepComplete("review", draft, lines, replacementOptions) || giftsToAdd.length > 0 || submitting) {
      return;
    }
    setSubmitError(null);
    try {
      if (draft.kind === "return") {
        const dto = returnRequestDto(draft, lines);
        const created =
          target.mode === "customer"
            ? await mutations.createReturn.mutateAsync({ orderId: target.orderId, dto })
            : await mutations.createGuestReturn.mutateAsync({
                orderNumber: target.orderNumber,
                orderAccessToken: target.orderAccessToken,
                dto,
              });
        clearSavedFlow(orderRef);
        setResult({ kind: "return", requestId: created.returnRequestId, requestNumber: created.returnNumber, status: created.status });
      } else {
        const dto = exchangeRequestDto(draft, lines);
        const created =
          target.mode === "customer"
            ? await mutations.createExchange.mutateAsync({ orderId: target.orderId, dto })
            : await mutations.createGuestExchange.mutateAsync({
                orderNumber: target.orderNumber,
                orderAccessToken: target.orderAccessToken,
                dto,
              });
        clearSavedFlow(orderRef);
        setResult({
          kind: "exchange",
          requestId: created.exchangeRequestId,
          requestNumber: created.exchangeNumber,
          status: created.status,
        });
      }
    } catch (error) {
      setSubmitError(afterSalesErrorMessage(error, t));
    }
  }, [draft, giftsToAdd.length, lines, mutations, orderRef, replacementOptions, submitting, t, target]);

  return {
    /** Return / exchange, whether each is offered and until when. */
    choices,
    choicesLoading: options.isLoading,
    /** The order's number for headings (from the backend, either mode). */
    orderNumber: options.data?.orderNumber ?? (target.mode === "guest" ? target.orderNumber : null),
    draft,
    step,
    steps,
    stepIndex,
    /** Steps the shopper may jump back to. */
    isDone: (s: FlowStep) => steps.indexOf(s) < stepIndex,
    canContinue,
    next,
    back,
    goTo,
    choose,
    setQuantity,
    toggleLine,
    setReason: (reasonCode: string) => update({ reasonCode }),
    setReasonText: (reasonText: string) => update({ reasonText }),
    setReplacement: (orderLineId: string, sku: string) =>
      setDraft((current) => ({ ...current, replacements: { ...current.replacements, [orderLineId]: sku } })),
    setNote: (note: string) => update({ note }),
    /** Order lines with what can still be picked. */
    lines,
    linesLoading: eligibility.isLoading,
    linesError: eligibility.error ? afterSalesErrorMessage(eligibility.error, t) : null,
    eligibleUntil: eligibility.data?.eligibleUntil ?? null,
    picked: pickedLines(draft, lines),
    replacementOptions,
    replacementOptionsLoading: exchangeOptions.isLoading,
    currencyCode: exchangeOptions.data?.currencyCode ?? returnEstimate.data?.currencyCode ?? null,
    returnEstimate,
    exchangeEstimate,
    /** The free gift has to come back with this return; `addRequiredGifts` adds it. */
    giftRequired: giftsToAdd.length > 0,
    addRequiredGifts,
    estimateError:
      (draft.kind === "return" ? returnEstimate.error : exchangeEstimate.error)
        ? afterSalesErrorMessage(draft.kind === "return" ? returnEstimate.error : exchangeEstimate.error, t)
        : null,
    submit,
    submitting,
    submitError,
    result,
  };
}

export type AfterSalesFlow = ReturnType<typeof useAfterSalesFlow>;

/**
 * Which order the flow page is for: a signed-in customer's (`/account/orders/[id]/return`)
 * or a guest's (`/track/[orderNumber]/return`, with the access token this browser
 * keeps for that order; it never travels in the address bar).
 */
export function useAfterSalesFlowTarget({
  orderId,
  orderNumber,
}: {
  orderId?: string;
  orderNumber?: string;
}): { target: ReturnOrderTarget | null; ready: boolean; missingToken: boolean } {
  const hydrated = useHydrated();
  // Browser only: the flow keeps its draft in session storage (and a guest's token in local storage).
  if (!hydrated) return { target: null, ready: false, missingToken: false };
  if (orderId) return { target: { mode: "customer", orderId }, ready: true, missingToken: false };
  if (!orderNumber) return { target: null, ready: false, missingToken: false };
  const token = getStoredGuestOrderAccessToken(orderNumber);
  return token
    ? { target: { mode: "guest", orderNumber, orderAccessToken: token }, ready: true, missingToken: false }
    : { target: null, ready: true, missingToken: true };
}
