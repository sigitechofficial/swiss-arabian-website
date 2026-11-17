"use client";

import { useState, type FormEvent } from "react";
import type { CatalogProduct } from "@/features/catalog/constants/catalogProducts";
import type { CheckoutSessionResponse } from "@/features/checkout/types/checkout";
import { formatPoints, type LoyaltyEarnPreviewView } from "@/features/loyalty/types/loyalty";
import { useGiftCardMutations } from "@/features/promotions/hooks/useGiftCardMutations";
import type { visibleGiftCards } from "@/features/promotions";
import { ApiClientError } from "@/lib/api/apiError";
import { brandFeatureEnabled } from "@/lib/brand/features";
import { Button } from "../../ui";
import { buttonClass } from "../../ui/Button";
import { cx } from "../../ui/shared";
import { useSapilCopy, type SapilTranslator } from "../../i18n/SapilCopy";
import type { SapilCopyKey } from "../../i18n/catalog";
import { useSapilMoney } from "../commerce/shared";

/* ——— "Don't miss this": add-ons above the form (Swiss `MissThisSwiper`) ——— */

export function MissThisRow({
  products,
  canAdd,
  onAdd,
}: {
  products: CatalogProduct[];
  canAdd: (product: CatalogProduct) => boolean;
  onAdd: (product: CatalogProduct) => void;
}) {
  const t = useSapilCopy();
  const money = useSapilMoney();
  if (!products.length) return null;
  return (
    <section aria-labelledby="checkout-miss-heading" className="bg-sapil-white rounded-[24px] p-[20px] max-900:rounded-[20px] max-900:p-[16px]">
      <h2 id="checkout-miss-heading" className="font-sapil-sans font-[700] text-[17px] tracking-[-.01em] mb-[12px]">
        {t("checkout.missThis")}
      </h2>
      <ul className="list-none flex gap-[12px] overflow-x-auto pb-[4px] snap-x">
        {products.map((product) => {
          const addable = canAdd(product);
          return (
            <li
              key={product.id}
              className="snap-start shrink-0 w-[240px] flex items-center gap-[12px] border border-sapil-line rounded-[16px] p-[10px]"
            >
              <span className="w-[56px] h-[56px] shrink-0 rounded-[12px] bg-sapil-tile grid place-items-center overflow-hidden">
                {product.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- catalogue images come from the API as-is
                  <img src={product.imageUrl} alt="" className="h-[86%] object-contain" />
                ) : null}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[14px] font-[600] leading-[1.3] line-clamp-2">{product.title}</span>
                <span className="block text-[13px] text-sapil-ink-2 tabular-nums">{money(product.price ?? 0, product.currency)}</span>
              </span>
              <button
                type="button"
                disabled={!addable}
                onClick={() => onAdd(product)}
                title={addable ? undefined : t("checkout.missUnavailable", { name: product.title })}
                aria-label={addable ? t("checkout.missAdd", { name: product.title }) : t("checkout.missUnavailable", { name: product.title })}
                className="w-[36px] h-[36px] shrink-0 rounded-full border border-sapil-line-2 grid place-items-center text-[20px] leading-none hover:border-sapil-accent hover:text-sapil-accent disabled:opacity-40 disabled:cursor-not-allowed"
              >
                +
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/* ——— gift card (Swiss `GiftCardForm`), shared mutations ——— */

const GIFT_CARD_CODES = new Set([
  "GIFT_CARD_NOT_FOUND",
  "GIFT_CARD_INACTIVE",
  "GIFT_CARD_EXPIRED",
  "GIFT_CARD_ALREADY_APPLIED",
  "GIFT_CARD_INSUFFICIENT_BALANCE",
  "GIFT_CARD_NOT_APPLICABLE",
  "GIFT_CARD_REQUIRES_LOGIN",
  "GIFT_CARD_USAGE_LIMIT_REACHED",
  "PRICING_CHANGED",
  "REDEMPTION_EXPIRED",
]);

/** The backend's gift card error in the shopper's language. */
export function giftCardErrorText(t: SapilTranslator, error: unknown): string {
  const code = error instanceof ApiClientError ? error.code?.trim().toUpperCase() : undefined;
  if (code && GIFT_CARD_CODES.has(code)) return t(`checkout.giftCardErr_${code}` as SapilCopyKey);
  return t("checkout.giftCardError");
}

export function GiftCardBox({
  cards,
  currency,
  checkoutSessionId,
  onCheckoutSession,
}: {
  cards: ReturnType<typeof visibleGiftCards>;
  currency: string;
  checkoutSessionId?: string | null;
  onCheckoutSession?: (session: CheckoutSessionResponse) => void | Promise<void>;
}) {
  const t = useSapilCopy();
  const money = useSapilMoney();
  const { apply, remove, balance, cartId, checkoutSessionId: sessionId } = useGiftCardMutations({
    checkoutSessionId,
    onCheckoutSession,
  });
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const ready = Boolean(sessionId || cartId);
  const busy = apply.isPending || remove.isPending || balance.isPending;

  async function onApply(event: FormEvent) {
    event.preventDefault();
    const next = code.trim();
    if (!next || !ready) return;
    setError(null);
    setNote(null);
    try {
      await apply.mutateAsync(next);
      setCode("");
    } catch (err) {
      setError(giftCardErrorText(t, err));
    }
  }

  async function onRemove(usageId?: string | null) {
    setError(null);
    try {
      await remove.mutateAsync(usageId);
    } catch (err) {
      setError(giftCardErrorText(t, err));
    }
  }

  async function onCheck() {
    const next = code.trim();
    if (!next) {
      setNote(null);
      setError(t("checkout.giftCardNeedCode"));
      return;
    }
    setError(null);
    try {
      const result = await balance.mutateAsync(next);
      const remaining = Number(result.remainingBalance);
      const label = result.maskedCode || t("checkout.giftCardTitle");
      setNote(
        Number.isFinite(remaining)
          ? t("checkout.giftCardBalance", { code: label, amount: money(remaining, result.currencyCode || currency) })
          : t("checkout.giftCardChecked", { code: label }),
      );
    } catch (err) {
      setNote(null);
      setError(giftCardErrorText(t, err));
    }
  }

  return (
    <div className="mt-[18px]">
      <p className="text-[14px] font-[600] mb-[8px]">{t("checkout.giftCardTitle")}</p>
      {cards.map((card, index) => {
        const amount = Number(card.amount);
        return (
          <div
            key={card.usageId ?? card.maskedCode ?? index}
            className="flex items-center gap-[12px] py-[8px] px-[12px] mb-[8px] rounded-[12px] bg-sapil-ok-soft text-[14px]"
          >
            <span className="flex-1 min-w-0">
              <b className="block font-[600]" dir="ltr">
                {card.maskedCode || t("checkout.giftCardTitle")}
              </b>
              <small className="block text-[12px] text-sapil-ink-2">{t("checkout.giftCardApplied")}</small>
            </span>
            {amount > 0 ? (
              <span className="font-[600] text-sapil-ok tabular-nums">−{money(amount, card.currencyCode || currency)}</span>
            ) : null}
            <button
              type="button"
              className={cx(buttonClass("link"), "!text-[13px]")}
              onClick={() => void onRemove(card.usageId)}
              disabled={busy}
            >
              {remove.isPending ? t("checkout.promoRemoving") : t("checkout.promoRemove")}
            </button>
          </div>
        );
      })}
      <form className="flex gap-[8px]" onSubmit={(event) => void onApply(event)} noValidate>
        <label className="sr-only" htmlFor="co-giftcard">
          {t("checkout.giftCardLabel")}
        </label>
        <input
          id="co-giftcard"
          name="gift-card"
          autoComplete="off"
          spellCheck={false}
          dir="ltr"
          placeholder={t("checkout.giftCardPlaceholder")}
          aria-invalid={error ? true : undefined}
          aria-describedby="co-giftcard-msg"
          value={code}
          disabled={busy || !ready}
          onChange={(event) => {
            setCode(event.target.value);
            if (error) setError(null);
            if (note) setNote(null);
          }}
          className="h-[46px] rounded-[14px] border border-sapil-line-2 bg-sapil-card px-[16px] font-sapil-sans text-[15px] text-sapil-ink w-full min-w-0 placeholder:text-[#757575] rtl:text-right [transition:border-color_.18s,box-shadow_.18s] focus:outline-none focus:border-sapil-accent focus:shadow-[0_0_0_3px_var(--sapil-accent-soft)]"
        />
        <Button type="submit" variant="line" disabled={busy || !ready || !code.trim()} className="!h-[46px] !px-[18px] shrink-0">
          {apply.isPending ? t("checkout.promoApplying") : t("checkout.promoApply")}
        </Button>
      </form>
      <button type="button" className={cx(buttonClass("link"), "!text-[13px] mt-[6px]")} onClick={() => void onCheck()} disabled={busy}>
        {balance.isPending ? t("checkout.giftCardChecking") : t("checkout.giftCardCheck")}
      </button>
      <p
        id="co-giftcard-msg"
        aria-live="polite"
        className={cx("text-[13px] mt-[6px] empty:hidden", error ? "text-sapil-sale" : "text-sapil-ink-2")}
      >
        {error ?? note}
      </p>
    </div>
  );
}

/* ——— points this order earns (Swiss `EarnPreviewNote`), only while loyalty is on ——— */

export function EarnNote({ preview }: { preview: LoyaltyEarnPreviewView | null | undefined }) {
  const t = useSapilCopy();
  if (!brandFeatureEnabled("loyalty") || !preview?.enabled) return null;
  return (
    <p className="mt-[12px] text-[13px] text-sapil-ink-2" data-testid="earn-preview">
      {t("checkout.earnPoints", { points: formatPoints(preview.estimatedPoints) })}
    </p>
  );
}
