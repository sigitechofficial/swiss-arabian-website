"use client";

import { useBagPage } from "@/features/cart/hooks/useBagPage";
import { cartErrorMessage } from "@/features/cart/constants/validationMessages";
import { appliedCoupon } from "@/features/promotions";
import { useCouponForm } from "@/features/promotions/hooks/useCouponForm";
import { useGiftAwards } from "@/features/promotions/hooks/useGiftAwards";
import { BagLine, Breadcrumbs, Button, Wrap } from "../../ui";
import { buttonClass } from "../../ui/Button";
import { cx } from "../../ui/shared";
import { useSapilCopy } from "../../i18n/SapilCopy";
import { toBagGiftData, toBagLineData } from "../../components/bag/bagData";
import { CheckoutEmptyCard, OrderSummary, type SummaryTotalRow } from "../../components/checkout/CheckoutParts";
import { SapilPointsBox } from "../../components/checkout/SapilPointsBox";
import { loyaltyLineFromQuote } from "@/features/loyalty/hooks/useLoyaltyRedemption";
import { SapilLink, SapilSkeleton, richText, useSapilMoney, useSapilMoneyParts } from "../../components/commerce/shared";

/** `/cart`: the drawer's lines on a page, with the checkout summary column (design-system page). */
export function SapilCartPage() {
  const t = useSapilCopy();
  const money = useSapilMoney();
  const moneyParts = useSapilMoneyParts();
  const bag = useBagPage();
  const coupon = useCouponForm();
  const { views } = useGiftAwards(null, bag.currency);
  const crumbs = [{ label: t("bag.pageCrumbHome"), href: "/" }, { label: t("bag.pageCrumbBag") }];

  if (!bag.mounted) {
    return (
      <Wrap className="w-full pt-[32px] pb-[88px] min-h-[70vh]" aria-busy="true">
        <SapilSkeleton className="h-[48px] w-[220px] mb-[24px]" />
        <div className="grid grid-cols-[minmax(0,7fr)_minmax(0,5fr)] gap-[56px] max-900:grid-cols-[1fr]">
          <SapilSkeleton className="h-[320px] !rounded-[24px]" />
          <SapilSkeleton className="h-[320px] !rounded-[28px] max-900:hidden" />
        </div>
      </Wrap>
    );
  }

  if (bag.isEmpty) {
    return (
      <Wrap className="w-full pt-[32px] pb-[88px] max-900:pb-[56px] min-h-[70vh]">
        <Breadcrumbs label={t("content.breadcrumb")} items={crumbs} LinkComponent={SapilLink} />
        <div className="mt-[24px]">
          <CheckoutEmptyCard
            title={t("bag.emptyTitle")}
            body={t("bag.emptyBody")}
            actions={
              <Button href="/products" LinkComponent={SapilLink}>
                {t("bag.emptyCta")}
              </Button>
            }
          />
        </div>
      </Wrap>
    );
  }

  const lineData = toBagLineData({
    lines: bag.orderedLines,
    promotions: bag.promotions,
    bundleLabel: bag.bundleLabel,
    money,
    t,
  });
  const byKey = new Map(bag.orderedLines.map((line) => [line.cartItemId ?? line.variantId, line]));
  const gifts = toBagGiftData(views, money);

  const totals = bag.totals;
  const rows: SummaryTotalRow[] = [];
  if (!bag.quotePending) {
    rows.push({ key: "sub", label: t("bag.subtotal"), value: money(bag.subtotal, bag.currency) });
    if (bag.discount > 0) {
      rows.push({
        key: "disc",
        label: t("bag.discount"),
        sub: appliedCoupon(bag.promotions)?.code,
        value: `−${money(bag.discount, bag.currency)}`,
        tone: "save",
      });
    }
    rows.push({
      key: "ship",
      label: t("bag.delivery"),
      value:
        bag.shipping == null
          ? t("bag.deliveryAtCheckout")
          : bag.shipping === 0
            ? t("bag.deliveryFree")
            : money(bag.shipping, bag.currency),
    });
    if (totals && totals.tax > 0 && !totals.taxIncluded) {
      rows.push({ key: "tax", label: totals.taxLabel ?? "VAT", value: money(totals.tax, bag.currency) });
    }
  }
  const payable = bag.amountPayable ?? bag.total;
  // Points and gift cards are tenders: show the total, what they cover, then what is left to pay.
  const showPayable = !bag.quotePending && bag.amountPayable != null && bag.amountPayable !== bag.total;
  if (showPayable) {
    rows.push({ key: "total", label: t("checkout.total"), value: money(bag.total, bag.currency) });
    const points = loyaltyLineFromQuote(bag.loyaltyRedemption);
    if (points && points.amount > 0) {
      rows.push({
        key: "points",
        label: t("checkout.rewardPoints", { points: points.points }),
        value: `−${money(points.amount, points.currency || bag.currency)}`,
        tone: "save",
      });
    }
    for (const card of bag.giftCards) {
      const amount = Number(card.amount);
      if (amount > 0) {
        rows.push({
          key: `gc-${card.usageId ?? card.maskedCode}`,
          label: t("checkout.giftCard", { code: card.maskedCode ?? "" }),
          value: `−${money(amount, card.currencyCode || bag.currency)}`,
          tone: "save",
        });
      }
    }
  }

  return (
    <Wrap className="w-full pt-[32px] pb-[88px] max-900:pt-[20px] max-900:pb-[56px] min-h-[70vh]">
      <Breadcrumbs label={t("content.breadcrumb")} items={crumbs} LinkComponent={SapilLink} />
      <header className="flex items-end gap-[14px] mt-[18px] mb-[24px]">
        <h1 className="font-sapil-display font-[400] text-[clamp(36px,4vw,52px)] leading-[1]">{t("bag.title")}</h1>
        <span className="text-[15px] text-sapil-muted pb-[4px]">{t("bag.items", { count: bag.itemCount })}</span>
      </header>
      <div className="grid grid-cols-[minmax(0,7fr)_minmax(0,5fr)] gap-[56px] items-start max-900:grid-cols-[1fr] max-900:gap-[20px]">
        <section aria-label={t("bag.title")} aria-live="polite" className="bg-sapil-white rounded-[24px] py-[6px] px-[24px] max-900:px-[16px] max-900:rounded-[20px]">
          {lineData.map((line) => (
            <BagLine
              key={line.key}
              name={line.name}
              href={line.href}
              imageSrc={line.imageSrc}
              detail={line.detail}
              tile={line.tile}
              quantity={line.quantity}
              max={line.max}
              disabled={line.unavailable}
              total={line.total}
              was={line.was}
              LinkComponent={SapilLink}
              onQuantityChange={(next) => {
                const source = byKey.get(line.key);
                if (!source) return;
                if (next < 1) bag.removeLine(source);
                else bag.setLineQuantity(source, next);
              }}
              onRemove={() => {
                const source = byKey.get(line.key);
                if (source) bag.removeLine(source);
              }}
              labels={{
                remove: t("bag.remove"),
                removeItem: t("bag.removeItem", { name: line.name }),
                was: t("bag.was"),
                stepper: {
                  group: t("bag.quantity", { name: line.name }),
                  decrease: t("bag.decrease", { name: line.name }),
                  increase: t("bag.increase", { name: line.name }),
                  remove: t("bag.removeItem", { name: line.name }),
                },
              }}
              extra={
                line.tags?.length || line.stockNote || line.unavailable ? (
                  <span className="block mt-[6px] text-[12px] text-sapil-muted">
                    {line.tags?.map((tag) => tag.text).join(" · ")}
                    {line.unavailable ? <span className="block text-sapil-sale">{t("bag.unavailableNote")}</span> : null}
                    {line.stockNote ? <span className="block" role="status">{line.stockNote}</span> : null}
                  </span>
                ) : null
              }
            />
          ))}
          {gifts.map((gift) =>
            gift.kind === "notice" ? (
              <p key={gift.key} className="py-[12px] text-[13px] text-sapil-ink-2" role="status">
                {gift.message}
              </p>
            ) : gift.kind === "choose" ? (
              <div key={gift.key} className="flex items-center justify-between gap-[12px] my-[12px] py-[12px] px-[14px] rounded-[14px] bg-sapil-p-mint">
                <b className="text-[14px] font-[600]">{t("bag.giftWaiting")}</b>
                <button type="button" onClick={gift.onChoose} className={cx(buttonClass("add"), "!h-[36px]")}>
                  {t("bag.giftChoose")}
                </button>
              </div>
            ) : (
              <div key={gift.key} className="py-[12px] border-b border-sapil-line last:border-b-0 text-[14px]">
                {gift.gifts.map((item) => (
                  <p key={item.key} className="flex justify-between gap-[12px]">
                    <span>
                      <span className="me-[6px] py-[1px] px-[8px] rounded-full bg-sapil-ok-soft text-sapil-ok text-[12px] font-[600]">
                        {t("bag.giftTag")}
                      </span>
                      {item.name} · {t("bag.giftQty", { count: item.quantity })}
                    </span>
                    <span className="font-[600]">{t("bag.giftFree")}</span>
                  </p>
                ))}
                {gift.onChange ? (
                  <button type="button" onClick={gift.onChange} className={cx(buttonClass("link"), "mt-[8px] !text-[13px]")}>
                    {t("bag.giftChange")}
                  </button>
                ) : null}
              </div>
            ),
          )}
        </section>

        <OrderSummary
          open
          lines={[]}
          promo={{
            value: coupon.value,
            onChange: coupon.setCode,
            onSubmit: (event) => void coupon.onApply(event),
            disabled: coupon.busy || !coupon.cartId,
            busy: coupon.busy,
            submitLabel: coupon.applying
              ? t("checkout.promoApplying")
              : coupon.applied?.code
                ? t("checkout.promoReplace")
                : t("checkout.promoApply"),
            message: coupon.fieldError
              ? { tone: "bad", content: coupon.fieldError }
              : coupon.applied?.code
                ? {
                    tone: "good",
                    content: (
                      <>
                        {richText(t("checkout.promoApplied"), { code: <b>{coupon.applied.code}</b> })}{" "}
                        <button type="button" className={cx(buttonClass("link"), "!text-[13px]")} onClick={() => void coupon.onRemove()}>
                          {coupon.removing ? t("checkout.promoRemoving") : t("checkout.promoRemove")}
                        </button>
                      </>
                    ),
                  }
                : null,
          }}
          rewards={bag.quotePending ? null : <SapilPointsBox />}
          rows={rows}
          grand={
            bag.quotePending
              ? { label: t("bag.total"), currency: "", amount: t("bag.updating") }
              : { label: showPayable ? t("checkout.toPay") : t("bag.total"), ...moneyParts(payable, bag.currency) }
          }
          vatNote={
            totals && totals.tax > 0 && totals.taxIncluded
              ? t("checkout.taxIncluded", { amount: money(totals.tax, bag.currency), label: totals.taxLabel ?? "VAT" })
              : undefined
          }
          notes={
            <div className="mt-[18px] flex flex-col gap-[10px]">
              {bag.priceChanged ? (
                <p className="text-[13px] text-sapil-ink-2" role="status">
                  {t("bag.pagePriceChanged")}
                </p>
              ) : null}
              {bag.blockingErrors.length ? (
                <ul className="text-[13px] text-sapil-sale" role="alert">
                  {bag.blockingErrors.map((issue, index) => (
                    <li key={`${issue.type}-${issue.cartItemId ?? index}`}>{cartErrorMessage(issue.type, issue.message)}</li>
                  ))}
                </ul>
              ) : null}
              <Button
                onClick={() => void bag.goToCheckout()}
                disabled={bag.checkoutDisabled}
                className="w-full !h-[52px] !rounded-[16px] !text-[16px]"
              >
                {bag.syncing ? t("bag.updatingBag") : bag.validating ? t("bag.pageChecking") : t("bag.pageCheckout")}
              </Button>
              <SapilLink href="/products" className={cx(buttonClass("link"), "self-center !text-[14px]")}>
                {t("bag.continueShopping")}
              </SapilLink>
            </div>
          }
          trust={[t("bag.pageSecure")]}
          LinkComponent={SapilLink}
        />
      </div>
    </Wrap>
  );
}
