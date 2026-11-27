"use client";

import { useCallback, useEffect, useId, useRef, useState, type FormEvent } from "react";
import { getBrandConfig } from "@/lib/brand";
import { useAuthStore } from "@/stores/useAuthStore";
import { ApiClientError } from "@/lib/api/apiError";
import { resolveCatalogImageUrl } from "@/features/catalog/utils/resolveCatalogImageUrl";
import { formatMoney } from "@/lib/format/money";
import { useAddCatalogProduct } from "@/features/cart/hooks/useAddCatalogProduct";
import { LocaleLink } from "@/lib/i18n/LocaleLink";
import { useShopCopy } from "@/lib/i18n/useShopCopy";
import {
  clearAssistantHistory,
  fetchAssistantHistory,
  sendAssistantHandoff,
  sendAssistantMessage,
  assistantReturnFlowApi,
  type AssistantHandoffInput,
  type AssistantReturnFlowApi,
  type AssistantSendInput,
} from "../api/assistant.service";
import { AfterSalesCards } from "./AfterSalesCards";
import { AssistantAvatar, SuggestionIcon } from "./AssistantAvatar";
import { ReplyText } from "./ReplyText";
import { AssistantReturnFlow } from "./AssistantReturnFlow";
import { GuestReturnForm, type GuestReturnValues } from "./GuestReturnForm";
import type {
  AssistantAction,
  AssistantBubble,
  AssistantCard,
  AssistantChatResponse,
  AssistantFlowAction,
  AssistantFlowView,
  AssistantHistory,
} from "../types";
import { readSellingPrice } from "@/features/catalog/utils/priceSummary";

type Props = {
  zoneCode: string;
  locale: string;
  /** Replaceable in tests. */
  send?: (input: AssistantSendInput) => Promise<AssistantChatResponse>;
  loadHistory?: (zoneCode: string) => Promise<AssistantHistory>;
  clearHistory?: (zoneCode: string) => Promise<void>;
  handoff?: (input: AssistantHandoffInput) => Promise<{ ticketNumber: string }>;
  /** The return the customer works through in the chat. Replaceable in tests. */
  returnFlow?: AssistantReturnFlowApi;
  /** Adds a product to the bag through the shop's normal cart. Resolves false when it could not. */
  addToBag?: (product: { slug: string; name: string; imageUrl?: string; price?: number }) => Promise<boolean>;
};

/** The least time the typing dots show, in milliseconds. */
const TYPING_MIN_MS = 450;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Our own policy and page paths: the only paths a button may open. */
const OWN_PAGE = /^\/(?:(?:policies|pages)\/[a-z0-9][a-z0-9-]*|track)$/i;
const isOwnPagePath = (path: string) => OWN_PAGE.test(path);

type HandoffValues = { name: string; email: string; phone: string; note: string };

/** The small form shown when the shopper asks to send the chat to customer care. */
function HandoffForm({
  signedIn,
  onSend,
  onCancel,
}: {
  signedIn: boolean;
  onSend: (values: HandoffValues) => Promise<void>;
  onCancel: () => void;
}) {
  const copy = useShopCopy();
  const [values, setValues] = useState<HandoffValues>({ name: "", email: "", phone: "", note: "" });
  const [problem, setProblem] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const field = "w-full rounded-lg border border-black/20 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-black/50";
  const set = (key: keyof HandoffValues) => (event: { target: { value: string } }) =>
    setValues((current) => ({ ...current, [key]: event.target.value }));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (sending) return;
    if (!signedIn && !EMAIL.test(values.email.trim())) {
      setProblem(copy("assistant.handoff.emailNeeded"));
      return;
    }
    setProblem(null);
    setSending(true);
    try {
      await onSend(values);
    } catch {
      setProblem(copy("assistant.handoff.error"));
      setSending(false);
    }
  };

  return (
    <form onSubmit={submit} data-assistant-handoff className="space-y-2 rounded-xl border border-black/10 bg-white p-3 text-xs">
      <p className="m-0 opacity-80">{copy("assistant.handoff.intro")}</p>
      {signedIn ? null : (
        <>
          <input aria-label={copy("assistant.handoff.name")} placeholder={copy("assistant.handoff.name")} value={values.name} onChange={set("name")} maxLength={120} className={field} />
          <input type="email" aria-label={copy("assistant.handoff.email")} placeholder={copy("assistant.handoff.email")} value={values.email} onChange={set("email")} maxLength={254} className={field} />
          <input type="tel" aria-label={copy("assistant.handoff.phone")} placeholder={copy("assistant.handoff.phone")} value={values.phone} onChange={set("phone")} maxLength={32} className={field} />
        </>
      )}
      <textarea aria-label={copy("assistant.handoff.note")} placeholder={copy("assistant.handoff.note")} value={values.note} onChange={set("note")} maxLength={600} rows={2} className={field} />
      {problem ? (
        <p role="alert" className="m-0 text-red-800">
          {problem}
        </p>
      ) : null}
      <div className="flex gap-2">
        <button type="submit" disabled={sending} className="cursor-pointer rounded-full border border-black/20 bg-white px-3 py-1.5 hover:bg-black/5 disabled:opacity-50">
          {sending ? copy("assistant.handoff.sending") : copy("assistant.handoff.send")}
        </button>
        <button type="button" onClick={onCancel} disabled={sending} className="cursor-pointer rounded-full px-3 py-1.5 opacity-70 hover:bg-black/5">
          {copy("assistant.handoff.cancel")}
        </button>
      </div>
    </form>
  );
}

function ProductCard({
  card,
  onAdd,
}: {
  card: AssistantCard;
  /** Adds this product to the bag. Resolves false when it could not. Without it the card has no button. */
  onAdd?: (card: AssistantCard) => Promise<boolean>;
}) {
  const copy = useShopCopy();
  const [state, setState] = useState<"idle" | "adding" | "added">("idle");
  const image = resolveCatalogImageUrl(card.image);
  const price = readSellingPrice(card.priceSummary) ?? Number.NaN;
  const compareAt = Number(card.priceSummary?.compareAtPrice);
  const currency = card.priceSummary?.currencyCode?.trim() || "AED";
  const showPrice = Number.isFinite(price);
  const onSale = showPrice && Number.isFinite(compareAt) && compareAt > price;
  const percentOff = onSale ? Math.round((1 - price / compareAt) * 100) : 0;
  const canAdd = Boolean(onAdd && card.slug && showPrice);

  const add = async () => {
    if (!onAdd || state === "adding") return;
    setState("adding");
    const ok = await onAdd(card);
    setState(ok ? "added" : "idle");
  };

  const body = (
    <>
      {image ? (
        <span className="relative flex h-28 w-full items-center justify-center overflow-hidden rounded-lg bg-black/5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt="" loading="lazy" className="h-full w-full object-contain" />
          {percentOff >= 1 ? (
            <span data-assistant-badge className="absolute start-1 top-1 rounded-full bg-red-700 px-1.5 py-0.5 text-[10px] font-medium text-white">
              {copy("assistant.percentOff", { percent: String(percentOff) })}
            </span>
          ) : null}
        </span>
      ) : null}
      <span className="mt-2 line-clamp-2 text-xs font-medium leading-snug">{card.name}</span>
      {showPrice ? (
        <span className="mt-1 text-xs">
          {onSale ? <s className="me-1 opacity-60">{formatMoney(compareAt, currency)}</s> : null}
          {formatMoney(price, currency)}
          {!image && percentOff >= 1 ? (
            <span data-assistant-badge className="ms-1 text-red-700">
              {copy("assistant.percentOff", { percent: String(percentOff) })}
            </span>
          ) : null}
        </span>
      ) : null}
    </>
  );
  const linkClass = "flex flex-col text-start text-sa-primary no-underline";
  return (
    <div className="flex w-36 shrink-0 flex-col rounded-xl border border-black/10 bg-white p-2 text-start text-sa-primary">
      {card.slug ? (
        <LocaleLink
          href={`/products/${card.slug}`}
          className={linkClass}
          aria-label={copy("assistant.viewProduct", { name: card.name })}
        >
          {body}
        </LocaleLink>
      ) : (
        <div className={linkClass}>{body}</div>
      )}
      {canAdd ? (
        <button
          type="button"
          data-assistant-add
          onClick={() => void add()}
          disabled={state === "adding"}
          className="mt-2 cursor-pointer rounded-full border border-black/20 bg-white px-2 py-1 text-xs font-medium hover:bg-black/5 disabled:cursor-default disabled:opacity-60"
        >
          {copy(state === "adding" ? "assistant.adding" : state === "added" ? "assistant.addedShort" : "assistant.add")}
        </button>
      ) : null}
    </div>
  );
}

/**
 * The shopping assistant window: a launcher button and a small chat panel. It shows what the backend
 * answers and sends what the shopper types. It decides nothing: brand, customer and answers all come
 * from the backend.
 */
export function AssistantWidget({
  zoneCode,
  locale,
  send = sendAssistantMessage,
  loadHistory = fetchAssistantHistory,
  clearHistory = clearAssistantHistory,
  handoff = sendAssistantHandoff,
  returnFlow = assistantReturnFlowApi,
  addToBag: addToBagProp,
}: Props) {
  const copy = useShopCopy();
  const firstName = useAuthStore((state) => state.user?.firstName?.trim() || null);
  const addCatalogProduct = useAddCatalogProduct();
  const addToBag = addToBagProp ?? ((product) => addCatalogProduct({ ...product, title: product.name }));
  const [handoffOpenFor, setHandoffOpenFor] = useState<string | null>(null);
  // The return in the chat: held by the server, this is only what to draw.
  const [flow, setFlow] = useState<AssistantFlowView | null>(null);
  const [flowBusy, setFlowBusy] = useState(false);
  const [flowProblem, setFlowProblem] = useState<string | null>(null);
  // A guest's proof of the order (number and email code): in memory only, sent with each request, never saved here.
  const [guestProof, setGuestProof] = useState<{ orderNumber: string; code: string } | null>(null);
  const [guestFormOpen, setGuestFormOpen] = useState(false);
  const [retentionDays, setRetentionDays] = useState<number | null>(null);
  const panelId = useId();
  const [open, setOpen] = useState(false);
  // A pop-up rule's "chat with us" button asks the widget to open.
  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener("sa:assistant-open", onOpen);
    return () => window.removeEventListener("sa:assistant-open", onOpen);
  }, []);
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState("");
  const [bubbles, setBubbles] = useState<AssistantBubble[]>([]);
  // A signed-in customer's chat is saved; a guest's is saved too, under a chat key kept in this browser.
  const [signedIn, setSignedIn] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const historyRequested = useRef(false);
  const idCounter = useRef(0);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const accent = getBrandConfig().themeKey === "sapil" ? "bg-sapil-accent" : "bg-terra";

  const nextId = () => `m${(idCounter.current += 1)}`;

  /** A greeting and three ways to start. */
  const welcomeBubble = (): AssistantBubble => ({
    id: nextId(),
    role: "assistant",
    text: firstName ? copy("assistant.welcomeNamed", { name: firstName }) : copy("assistant.welcome"),
    welcome: true,
    quickReplies: [
      copy("assistant.quick.suggest"),
      copy("assistant.quick.bestsellers"),
      copy("assistant.quick.track"),
    ],
  });

  /** First time the window opens: bring back a signed-in customer's earlier chat, else greet. */
  const loadEarlierChat = async () => {
    try {
      const history = await loadHistory(zoneCode);
      setSignedIn(history.signedIn);
      setRetentionDays(history.retentionDays ?? null);
      if (history.messages.length > 0) {
        setBubbles(history.messages.map((m) => ({ id: nextId(), role: m.role, text: m.text })));
      } else {
        setBubbles([welcomeBubble()]);
      }
    } catch {
      setBubbles([welcomeBubble()]);
    } finally {
      setLoadingHistory(false);
      setHistoryLoaded(true);
    }
  };

  const toggle = () => {
    if (!open && !historyRequested.current) {
      historyRequested.current = true;
      setLoadingHistory(true);
      void loadEarlierChat();
    }
    setOpen(!open);
  };

  const clearChat = async () => {
    try {
      await clearHistory(zoneCode);
      setFlow(null);
      setBubbles([welcomeBubble()]);
    } catch {
      setBubbles((current) => [
        ...current,
        { id: nextId(), role: "assistant", text: copy("assistant.error"), isError: true },
      ]);
    }
  };

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // Keeping the view steady: a new message from the shopper scrolls down to it; a new answer scrolls to the
  // START of the answer (so it is read from the top), or to the bottom when it is short. Smooth, unless the
  // device asks for less motion. This also stops the jump that happened when buttons were removed and the
  // typing dots and the answer arrived one after the other.
  useEffect(() => {
    const list = listRef.current;
    if (!list || typeof list.scrollTo !== "function") return;
    const behavior: ScrollBehavior = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ? "auto" : "smooth";
    const last = bubbles[bubbles.length - 1];
    if (last?.role === "assistant" && !busy) {
      const row = list.querySelector<HTMLElement>(`[data-bubble-id="${last.id}"]`);
      if (row && row.offsetHeight > list.clientHeight - 24) {
        const delta = row.getBoundingClientRect().top - list.getBoundingClientRect().top;
        list.scrollTo({ top: Math.max(0, list.scrollTop + delta - 12), behavior });
        return;
      }
    }
    list.scrollTo({ top: list.scrollHeight, behavior });
  }, [bubbles, busy, flow]);

  const finishActions = (bubbleId: string) =>
    setBubbles((current) => current.map((b) => (b.id === bubbleId ? { ...b, actionsDone: true } : b)));

  const say = (text: string, isError = false) =>
    setBubbles((current) => [...current, { id: nextId(), role: "assistant", text, isError }]);

  const flowScope = { zoneCode, locale, ...(!signedIn && guestProof ? { code: guestProof.code } : {}) };

  /** Runs one flow request: the server answers with what to draw next. A failure can be retried. */
  const runFlow = async (request: () => Promise<AssistantFlowView | null>) => {
    if (flowBusy) return;
    setFlowBusy(true);
    setFlowProblem(null);
    try {
      const next = await request();
      setFlow(next);
    } catch {
      setFlowProblem(copy("assistant.returnFlow.problem"));
      // The flow may have moved on (another tab): look again so the card shows the truth.
      try {
        const current = await returnFlow.active(flowScope);
        if (current) setFlow(current);
      } catch {
        /* the message above stays */
      }
    } finally {
      setFlowBusy(false);
    }
  };
  const startFlow = (kind: "RETURN" | "EXCHANGE", orderId?: string) =>
    flow ? undefined : void runFlow(() => returnFlow.start(flowScope, kind, orderId));
  const startGuestFlow = (values: GuestReturnValues) => {
    if (flow) return;
    const proof = { orderNumber: values.orderNumber, code: values.code };
    setGuestProof(proof);
    void runFlow(async () => {
      const view = await returnFlow.start({ zoneCode, locale, ...proof }, values.kind);
      setGuestFormOpen(false);
      return view;
    });
  };
  const stepReturn = (action: AssistantFlowAction) =>
    flow?.flowId ? void runFlow(() => returnFlow.step(flowScope, flow.flowId as string, action)) : undefined;
  const confirmReturn = (token: string) =>
    flow?.flowId ? void runFlow(() => returnFlow.confirm(flowScope, flow.flowId as string, token)) : undefined;
  const cancelReturn = () =>
    flow?.flowId ? void runFlow(() => returnFlow.cancel(flowScope, flow.flowId as string)) : undefined;

  // A signed-in customer who left in the middle of a return finds it where they stopped.
  useEffect(() => {
    if (!open || !historyLoaded || !signedIn) return;
    let cancelled = false;
    returnFlow
      .active({ zoneCode, locale })
      .then((current) => {
        if (!cancelled && current) setFlow((existing) => existing ?? current);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, historyLoaded, signedIn, zoneCode, locale]);

  /** The shopper tapped "Yes, add to bag": the add runs here, through the normal cart. */
  const confirmAdd = async (bubble: AssistantBubble, action: Extract<AssistantAction, { type: "ADD_TO_BAG" }>) => {
    finishActions(bubble.id);
    if (!action.slug) return say(copy("assistant.addFailed"), true);
    const card = bubble.cards?.find((c) => c.productId === action.productId);
    const price = Number(card?.priceSummary?.price);
    const added = await addToBag({
      slug: action.slug,
      name: action.name,
      imageUrl: card?.image ?? undefined,
      price: Number.isFinite(price) && price > 0 ? price : undefined,
    });
    say(copy(added ? "assistant.added" : "assistant.addFailed"), !added);
  };

  /** The shopper tapped "Add" on a card: the shop's normal cart adds it, in this browser. */
  const addCardToBag = async (card: AssistantCard): Promise<boolean> => {
    if (!card.slug) return false;
    const price = Number(card.priceSummary?.price);
    const added = await addToBag({
      slug: card.slug,
      name: card.name,
      imageUrl: card.image ?? undefined,
      price: Number.isFinite(price) && price > 0 ? price : undefined,
    });
    if (!added) say(copy("assistant.addFailed"), true);
    return added;
  };

  const declineAdd = (bubble: AssistantBubble) => {
    finishActions(bubble.id);
    say(copy("assistant.addDeclined"));
  };

  const sendHandoff = async (bubble: AssistantBubble, values: HandoffValues) => {
    const transcript = signedIn
      ? undefined
      : bubbles
          .filter((b) => !b.isError && b.text.trim())
          .slice(-20)
          .map((b) => ({ role: b.role, text: b.text.slice(0, 1200) }));
    const result = await handoff({
      zoneCode,
      locale,
      note: values.note.trim() || undefined,
      name: signedIn ? undefined : values.name.trim() || undefined,
      email: signedIn ? undefined : values.email.trim(),
      phone: signedIn ? undefined : values.phone.trim() || undefined,
      transcript,
    });
    setHandoffOpenFor(null);
    finishActions(bubble.id);
    say(copy("assistant.handoff.done", { ticket: result.ticketNumber }));
  };

  /** Ids of the products in the latest answer that showed any, so "the first one" can be understood. */
  const recentProductIds = (): string[] => {
    for (let i = bubbles.length - 1; i >= 0; i -= 1) {
      const cards = bubbles[i].cards;
      if (cards && cards.length > 0) return cards.slice(0, 5).map((card) => card.productId);
    }
    return [];
  };

  const submit = useCallback(
    async (raw: string) => {
      const text = raw.trim();
      if (!text || busy) return;
      setDraft("");
      setBubbles((current) => [
        // Buttons belong to the answer they came with; once a new message goes out they go away.
        ...current.map((b) => (b.quickReplies ? { ...b, quickReplies: undefined } : b)),
        { id: nextId(), role: "user", text },
      ]);
      setBusy(true);
      try {
        const [result] = await Promise.all([
          send({ message: text, zoneCode, locale, recentProductIds: recentProductIds().length ? recentProductIds() : undefined }),
          // The dots stay for a moment even when the answer is quick, so the page does not flash.
          new Promise((resolve) => setTimeout(resolve, TYPING_MIN_MS)),
        ]);
        setBubbles((current) => [
          ...current,
          {
            id: nextId(),
            role: "assistant",
            text: result.reply.text,
            cards: result.reply.cards,
            afterSales: result.reply.afterSales,
            seeAllHref: result.reply.seeAllHref,
            quickReplies: result.reply.quickReplies,
            actions: result.reply.actions,
          },
        ]);
      } catch (error) {
        const tooMany = error instanceof ApiClientError && error.status === 429;
        setBubbles((current) => [
          ...current,
          {
            id: nextId(),
            role: "assistant",
            text: copy(tooMany ? "assistant.tooMany" : "assistant.error"),
            isError: true,
          },
        ]);
      } finally {
        setBusy(false);
        inputRef.current?.focus();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- recentProductIds only reads `bubbles`
    [busy, copy, locale, send, zoneCode, bubbles],
  );

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    void submit(draft);
  };

  return (
    <>
      {open ? (
        <section
          id={panelId}
          role="dialog"
          aria-label={copy("assistant.title")}
          data-assistant-panel
          // Above the fixed site header (z-200), below on-site pop-ups (z-210/220).
          className="fixed inset-x-0 bottom-0 z-[205] flex h-[88dvh] flex-col overflow-hidden rounded-t-2xl border border-black/10 bg-white text-sa-primary shadow-[0_24px_64px_-16px_rgba(0,0,0,0.3)] sm:inset-x-auto sm:bottom-[4.75rem] sm:end-4 sm:h-[min(calc(100dvh-6.5rem),46rem)] sm:w-[25rem] sm:rounded-2xl sa-assistant-pop sa-assistant-font"
        >
          <header className={`flex items-center gap-3 px-4 py-3.5 text-white ${accent}`}>
            <AssistantAvatar size={40} accent="bg-white/25" online ring />
            <div className="min-w-0 flex-1">
              <h2 className="m-0 truncate text-[15px] font-semibold leading-tight">{copy("assistant.title")}</h2>
              <p className="m-0 mt-0.5 flex items-center gap-1.5 truncate text-[11.5px] leading-tight text-white/85">
                <span className="size-1.5 shrink-0 rounded-full bg-emerald-300" aria-hidden="true" />
                <span className="truncate">{copy("assistant.status")}</span>
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {bubbles.some((bubble) => bubble.role === "user") ? (
                <button
                  type="button"
                  onClick={() => void clearChat()}
                  aria-label={copy("assistant.clear")}
                  title={copy("assistant.clear")}
                  className="flex size-8 cursor-pointer items-center justify-center rounded-md text-white/90 transition hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path
                      d="M4 7h16M10 11v6M14 11v6M6 7l1 12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-12M9 7V4h6v3"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={copy("assistant.close")}
                className="flex size-8 cursor-pointer items-center justify-center rounded-md text-white/90 transition hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          </header>

          {historyLoaded && !signedIn ? (
            <p className="m-0 border-b border-black/10 bg-black/[0.03] px-4 py-2 text-[11.5px] leading-snug text-sa-primary/70" data-assistant-guest-note>
              {retentionDays ? copy("assistant.guestNoteSaved", { days: retentionDays }) : copy("assistant.guestNote")}
              {!flow && !guestFormOpen ? (
                <button
                  type="button"
                  data-assistant-guest-return-open
                  onClick={() => setGuestFormOpen(true)}
                  className="ms-2 cursor-pointer font-medium underline underline-offset-2"
                >
                  {copy("assistant.guestReturn.open")}
                </button>
              ) : null}
            </p>
          ) : null}

          <div ref={listRef} className="flex-1 space-y-4 overflow-y-auto bg-[#faf8f5] px-4 py-4 text-[13px] leading-relaxed" aria-live="polite">
            {bubbles.map((bubble) => (
              <div
                key={bubble.id}
                data-bubble-id={bubble.id}
                className={bubble.role === "user" ? "sa-assistant-rise flex justify-end" : "sa-assistant-rise flex items-start justify-start gap-2"}
              >
                {bubble.role === "assistant" ? <AssistantAvatar size={26} accent={accent} /> : null}
                <div className={bubble.role === "user" ? "max-w-[88%] space-y-2.5" : "min-w-0 max-w-[calc(100%-2rem)] space-y-2.5"}>
                  <div
                    data-bubble={bubble.role}
                    className={
                      bubble.role === "user"
                        ? `rounded-2xl rounded-ee-md px-3.5 py-2.5 text-white shadow-sm ${accent}`
                        : `rounded-2xl rounded-es-md border px-3.5 py-2.5 shadow-sm ${bubble.isError ? "border-red-200 bg-red-50 text-red-800" : "border-black/10 bg-white"}`
                    }
                  >
                    <ReplyText text={bubble.text} />
                  </div>
                  {bubble.afterSales ? (
                    <AfterSalesCards view={bubble.afterSales} accent={accent} onStart={flow || flowBusy ? undefined : startFlow} />
                  ) : null}
                  {bubble.cards && bubble.cards.length > 0 ? (
                    <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1" data-assistant-cards>
                      {bubble.cards.map((card) => (
                        <ProductCard key={card.productId} card={card} onAdd={addCardToBag} />
                      ))}
                      {bubble.seeAllHref ? (
                        <LocaleLink
                          href={bubble.seeAllHref}
                          data-assistant-see-all
                          className="flex w-24 shrink-0 items-center justify-center rounded-xl border border-black/10 bg-white p-2 text-center text-xs font-medium text-sa-primary no-underline"
                        >
                          {copy("assistant.seeAll")}
                        </LocaleLink>
                      ) : null}
                    </div>
                  ) : null}
                  {bubble.actions && bubble.actions.length > 0 && !bubble.actionsDone
                    ? bubble.actions.map((action) =>
                        action.type === "ADD_TO_BAG" ? (
                          <div key={`add-${action.productId}`} className="flex flex-wrap gap-2" data-assistant-confirm>
                            <button
                              type="button"
                              onClick={() => void confirmAdd(bubble, action)}
                              className={`cursor-pointer rounded-full px-3 py-1.5 text-xs text-white ${accent}`}
                            >
                              {action.confirmLabel}
                            </button>
                            <button
                              type="button"
                              onClick={() => declineAdd(bubble)}
                              className="cursor-pointer rounded-full border border-black/20 bg-white px-3 py-1.5 text-xs hover:bg-black/5"
                            >
                              {action.cancelLabel}
                            </button>
                          </div>
                        ) : action.type === "HANDOFF" ? (
                          handoffOpenFor === bubble.id ? (
                            <HandoffForm
                              key="handoff-form"
                              signedIn={signedIn}
                              onSend={(values) => sendHandoff(bubble, values)}
                              onCancel={() => setHandoffOpenFor(null)}
                            />
                          ) : (
                            <button
                              key="handoff-button"
                              type="button"
                              data-assistant-handoff-button
                              onClick={() => setHandoffOpenFor(bubble.id)}
                              className="cursor-pointer rounded-full border border-black/20 bg-white px-3 py-1.5 text-xs hover:bg-black/5"
                            >
                              {action.label}
                            </button>
                          )
                        ) : action.type === "GUEST_RETURN" ? (
                          // Only a guest sees it; a signed-in customer starts from their own order cards.
                          signedIn ? null : (
                            <button
                              key="guest-return-button"
                              type="button"
                              data-assistant-guest-return-action
                              disabled={Boolean(flow) || flowBusy}
                              onClick={() => setGuestFormOpen(true)}
                              className={`w-fit cursor-pointer rounded-full px-3.5 py-1.5 text-xs font-medium text-white disabled:opacity-50 ${accent}`}
                            >
                              {action.label}
                            </button>
                          )
                        ) : action.type === "OPEN_PAGE" ? (
                          // Only our own policy and page paths become a button, whatever the server sends.
                          isOwnPagePath(action.path) ? (
                            <LocaleLink
                              key={`page-${action.path}`}
                              href={action.path}
                              data-assistant-open-page
                              className="block w-fit rounded-full border border-black/15 bg-white px-3.5 py-1.5 text-xs font-medium text-sa-primary no-underline transition hover:border-black/40 hover:bg-black/[0.03]"
                            >
                              {action.label}
                            </LocaleLink>
                          ) : null
                        ) : // An action type this website does not know (a newer server): drawn as nothing, never as a hand-off button.
                        null,
                      )
                    : null}
                  {bubble.quickReplies && bubble.quickReplies.length > 0 ? (
                    bubble.welcome ? (
                      <div className="grid gap-2" data-assistant-suggestions>
                        {bubble.quickReplies.map((label, index) => (
                          <button
                            key={label}
                            type="button"
                            disabled={busy}
                            onClick={() => void submit(label)}
                            className="group flex cursor-pointer items-center gap-3 rounded-xl border border-black/10 bg-white px-3 py-2.5 text-start text-[13px] font-medium text-sa-primary shadow-sm transition hover:-translate-y-px hover:border-black/30 hover:shadow focus-visible:outline focus-visible:outline-2 focus-visible:outline-black/40 disabled:opacity-50"
                          >
                            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-black/[0.04] text-sa-primary/80 transition group-hover:bg-black/[0.07]">
                              <SuggestionIcon index={index} />
                            </span>
                            <span className="min-w-0 flex-1">{label}</span>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0 opacity-40 rtl:-scale-x-100">
                              <path d="m9 6 6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {bubble.quickReplies.map((label) => (
                          <button
                            key={label}
                            type="button"
                            disabled={busy}
                            onClick={() => void submit(label)}
                            className="cursor-pointer rounded-full border border-black/15 bg-white px-3 py-1.5 text-xs font-medium text-sa-primary transition hover:border-black/40 hover:bg-black/[0.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-black/40 disabled:opacity-50"
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    )
                  ) : null}
                </div>
              </div>
            ))}
            {!signedIn && guestFormOpen && !flow ? (
              <div className="sa-assistant-rise flex items-start gap-2">
                <AssistantAvatar size={26} accent={accent} />
                <div className="min-w-0 flex-1">
                  <GuestReturnForm busy={flowBusy} onStart={startGuestFlow} onCancel={() => setGuestFormOpen(false)} />
                </div>
              </div>
            ) : null}
            {flow ? (
              <div className="sa-assistant-rise flex items-start gap-2">
                <AssistantAvatar size={26} accent={accent} />
                <div className="min-w-0 flex-1">
                  <AssistantReturnFlow
                    view={flow}
                    busy={flowBusy}
                    problem={flowProblem}
                    locale={locale}
                    accent={accent}
                    onStep={stepReturn}
                    onConfirm={confirmReturn}
                    onCancel={cancelReturn}
                    onClose={() => {
                      setFlow(null);
                      setFlowProblem(null);
                    }}
                  />
                </div>
              </div>
            ) : null}
            {busy || loadingHistory ? (
              <div className="flex items-start gap-2" role="status">
                <AssistantAvatar size={26} accent={accent} />
                <div className="inline-flex items-center gap-2 rounded-2xl rounded-es-md border border-black/10 bg-white px-3.5 py-3 shadow-sm">
                  <span className="sr-only">{copy("assistant.typing")}</span>
                  <span className="inline-flex gap-1" aria-hidden="true">
                    {[0, 150, 300].map((delay) => (
                      <i
                        key={delay}
                        className="size-1.5 animate-bounce rounded-full bg-current opacity-40"
                        style={{ animationDelay: `${delay}ms` }}
                      />
                    ))}
                  </span>
                </div>
              </div>
            ) : null}
          </div>

          <form onSubmit={onSubmit} className="border-t border-black/10 bg-white px-3 py-3">
            <div className="relative">
              <input
                ref={inputRef}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                maxLength={1000}
                aria-label={copy("assistant.inputLabel")}
                placeholder={copy("assistant.placeholder")}
                className="h-11 w-full min-w-0 rounded-xl border border-black/15 bg-white ps-3.5 pe-12 text-sm outline-none transition placeholder:text-sa-primary/45 focus:border-black/40 focus:ring-2 focus:ring-black/10"
              />
              <button
                type="submit"
                disabled={busy || draft.trim().length === 0}
                aria-label={copy("assistant.send")}
                title={copy("assistant.send")}
                className={`absolute end-1.5 top-1/2 flex size-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-lg text-white transition hover:brightness-95 disabled:cursor-default disabled:opacity-40 ${accent}`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="rtl:-scale-x-100">
                  <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
            <div className="mt-2 flex items-start justify-between gap-3 text-[10.5px] leading-snug text-sa-primary/60">
              <p className="m-0" data-assistant-disclaimer>
                {copy("assistant.disclaimer")}
              </p>
              <button
                type="button"
                disabled={busy}
                onClick={() => void submit(copy("assistant.talkToCare"))}
                className="shrink-0 cursor-pointer rounded-md px-1.5 py-0.5 font-medium text-sa-primary/80 underline underline-offset-2 transition hover:bg-black/[0.04] hover:text-sa-primary disabled:opacity-50"
              >
                {copy("assistant.careShort")}
              </button>
            </div>
          </form>
        </section>
      ) : null}

      <button
        type="button"
        onClick={toggle}
        aria-label={copy("assistant.open")}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        data-assistant-launcher
        className={`fixed bottom-3 end-4 z-[205] flex size-14 cursor-pointer items-center justify-center rounded-full text-white shadow-[0_10px_28px_-8px_rgba(0,0,0,0.4)] transition hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black/50 ${accent}`}
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H9l-4 3v-3H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        </svg>
        <span className="absolute end-0.5 top-0.5 size-3 rounded-full bg-emerald-400 ring-2 ring-white" aria-hidden="true" />
      </button>
    </>
  );
}
