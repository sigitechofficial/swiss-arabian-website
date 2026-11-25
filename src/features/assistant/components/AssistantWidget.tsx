"use client";

import { useCallback, useEffect, useId, useRef, useState, type FormEvent } from "react";
import { getBrandConfig } from "@/lib/brand";
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
  type AssistantHandoffInput,
  type AssistantSendInput,
} from "../api/assistant.service";
import { splitLinks } from "../lib/linkify";
import type {
  AssistantAction,
  AssistantBubble,
  AssistantCard,
  AssistantChatResponse,
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
  /** Adds a product to the bag through the shop's normal cart. Resolves false when it could not. */
  addToBag?: (product: { slug: string; name: string; imageUrl?: string; price?: number }) => Promise<boolean>;
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

function ReplyText({ text }: { text: string }) {
  return (
    <p className="m-0 whitespace-pre-line break-words">
      {splitLinks(text).map((part, index) => {
        if (part.kind === "path") {
          return (
            <LocaleLink key={index} href={part.value} className="underline">
              {part.value}
            </LocaleLink>
          );
        }
        if (part.kind === "url") {
          return (
            <a key={index} href={part.value} target="_blank" rel="noopener noreferrer" className="underline">
              {part.value}
            </a>
          );
        }
        return <span key={index}>{part.value}</span>;
      })}
    </p>
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
  addToBag: addToBagProp,
}: Props) {
  const copy = useShopCopy();
  const addCatalogProduct = useAddCatalogProduct();
  const addToBag = addToBagProp ?? ((product) => addCatalogProduct({ ...product, title: product.name }));
  const [handoffOpenFor, setHandoffOpenFor] = useState<string | null>(null);
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
  // Only a signed-in customer has a saved chat. A guest's chat lives in this page and nowhere else.
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
    text: copy("assistant.welcome"),
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

  useEffect(() => {
    listRef.current?.scrollTo?.({ top: listRef.current.scrollHeight });
  }, [bubbles, busy]);

  const finishActions = (bubbleId: string) =>
    setBubbles((current) => current.map((b) => (b.id === bubbleId ? { ...b, actionsDone: true } : b)));

  const say = (text: string, isError = false) =>
    setBubbles((current) => [...current, { id: nextId(), role: "assistant", text, isError }]);

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
        const result = await send({ message: text, zoneCode, locale, recentProductIds: recentProductIds().length ? recentProductIds() : undefined });
        setBubbles((current) => [
          ...current,
          {
            id: nextId(),
            role: "assistant",
            text: result.reply.text,
            cards: result.reply.cards,
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
          className="fixed bottom-20 end-4 z-[205] flex h-[min(70vh,34rem)] w-[min(92vw,23rem)] flex-col overflow-hidden rounded-2xl border border-black/10 bg-page text-sa-primary shadow-xl"
        >
          <header className={`flex items-center justify-between px-4 py-3 text-white ${accent}`}>
            <h2 className="m-0 text-base font-medium">{copy("assistant.title")}</h2>
            <div className="flex items-center gap-1">
              {signedIn && bubbles.some((bubble) => bubble.role === "user") ? (
                <button
                  type="button"
                  onClick={() => void clearChat()}
                  className="cursor-pointer rounded-full px-2.5 py-1 text-xs hover:bg-white/15"
                >
                  {copy("assistant.clear")}
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={copy("assistant.close")}
                className="flex size-8 cursor-pointer items-center justify-center rounded-full text-xl leading-none hover:bg-white/15"
              >
                ×
              </button>
            </div>
          </header>

          {historyLoaded && !signedIn ? (
            <p className="m-0 border-b border-black/10 bg-black/5 px-3 py-1.5 text-xs opacity-80" data-assistant-guest-note>
              {copy("assistant.guestNote")}
            </p>
          ) : null}

          <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-3 py-3 text-sm" aria-live="polite">
            {bubbles.map((bubble) => (
              <div key={bubble.id} className={bubble.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <div className="max-w-[88%] space-y-2">
                  <div
                    data-bubble={bubble.role}
                    className={
                      bubble.role === "user"
                        ? `rounded-2xl rounded-ee-sm px-3 py-2 text-white ${accent}`
                        : `rounded-2xl rounded-es-sm px-3 py-2 ${bubble.isError ? "bg-red-50 text-red-800" : "bg-black/5"}`
                    }
                  >
                    <ReplyText text={bubble.text} />
                  </div>
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
                        ) : handoffOpenFor === bubble.id ? (
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
                        ),
                      )
                    : null}
                  {bubble.quickReplies && bubble.quickReplies.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {bubble.quickReplies.map((label) => (
                        <button
                          key={label}
                          type="button"
                          disabled={busy}
                          onClick={() => void submit(label)}
                          className="cursor-pointer rounded-full border border-black/20 bg-white px-3 py-1.5 text-xs hover:bg-black/5 disabled:opacity-50"
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
            {busy || loadingHistory ? (
              <div className="flex justify-start" role="status">
                <div className="rounded-2xl rounded-es-sm bg-black/5 px-3 py-2 opacity-70">{copy("assistant.typing")}</div>
              </div>
            ) : null}
          </div>

          <form onSubmit={onSubmit} className="flex gap-2 border-t border-black/10 bg-white p-2">
            <input
              ref={inputRef}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              maxLength={1000}
              aria-label={copy("assistant.inputLabel")}
              placeholder={copy("assistant.placeholder")}
              className="min-w-0 flex-1 rounded-full border border-black/20 px-3 py-2 text-sm outline-none focus:border-black/50"
            />
            <button
              type="submit"
              disabled={busy || draft.trim().length === 0}
              className={`cursor-pointer rounded-full px-4 py-2 text-sm text-white disabled:opacity-50 ${accent}`}
            >
              {copy("assistant.send")}
            </button>
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
        className={`fixed bottom-4 end-4 z-[205] flex size-14 cursor-pointer items-center justify-center rounded-full text-white shadow-lg ${accent}`}
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H9l-4 3v-3H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </>
  );
}
