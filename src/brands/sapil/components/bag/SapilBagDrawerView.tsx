"use client";

import type { ReactNode } from "react";
import { BagLine, Button, Drawer, FreeDeliveryCard, SummaryRow } from "../../ui";
import { buttonClass } from "../../ui/Button";
import { cx, DefaultLink, type SapilLinkComponent } from "../../ui/shared";
import { useSapilCopy } from "../../i18n/SapilCopy";
import type { BundleTag } from "@/features/cart/utils/bundleTags";

/** One bag line, ready to show (prices already formatted). */
export type SapilBagLineData = {
  key: string;
  name: string;
  href: string;
  imageSrc?: string;
  /** "Juicy Pleasures · AED 63 each" */
  detail: ReactNode;
  tile?: string;
  quantity: number;
  max?: number;
  unavailable?: boolean;
  total: ReactNode;
  was?: ReactNode;
  tags?: BundleTag[];
  stockNote?: string;
};

export type SapilBagGiftData =
  | { kind: "notice"; key: string; message: string }
  | { kind: "choose"; key: string; onChoose: () => void }
  | {
      kind: "awarded";
      key: string;
      gifts: Array<{ key: string; name: string; imageSrc?: string; quantity: number; listPrice?: ReactNode }>;
      onChange?: () => void;
    };

export type SapilFreeDelivery =
  | { state: "start"; threshold: ReactNode }
  | { state: "progress"; remaining: ReactNode; threshold: ReactNode; percent: number }
  | { state: "unlocked" };

export type SapilBagDrawerViewProps = {
  open: boolean;
  onClose: () => void;
  count: number;
  /** hidden when the market has no free-delivery threshold */
  freeDelivery: SapilFreeDelivery | null;
  lines: SapilBagLineData[];
  gifts?: SapilBagGiftData[];
  onQuantityChange: (key: string, quantity: number) => void;
  onRemove: (key: string) => void;
  subtotal: ReactNode;
  /** full price struck before the subtotal when a discount applies */
  subtotalWas?: ReactNode;
  delivery: ReactNode;
  total: ReactNode;
  /** promotion progress message from the promotions API */
  promoNote?: ReactNode;
  checkoutHref: string;
  checkoutBlocked?: boolean;
  syncing?: boolean;
  shopHref: string;
  LinkComponent?: SapilLinkComponent;
};

/** v9 bag drawer (`.drawer`): free-delivery card, linked lines with tinted steppers, totals, checkout. */
export function SapilBagDrawerView({
  open,
  onClose,
  count,
  freeDelivery,
  lines,
  gifts = [],
  onQuantityChange,
  onRemove,
  subtotal,
  subtotalWas,
  delivery,
  total,
  promoNote,
  checkoutHref,
  checkoutBlocked = false,
  syncing = false,
  shopHref,
  LinkComponent,
}: SapilBagDrawerViewProps) {
  const t = useSapilCopy();
  const Link = LinkComponent ?? DefaultLink;
  const empty = lines.length === 0;

  const ship = freeDelivery ? (
    freeDelivery.state === "unlocked" ? (
      <FreeDeliveryCard
        percent={100}
        unlocked
        title={t("bag.shipUnlocked")}
        detail={t("bag.shipUnlockedDetail")}
        badge={t("bag.shipFree")}
        progressLabel={t("bag.shipProgress")}
      />
    ) : freeDelivery.state === "start" ? (
      <FreeDeliveryCard
        percent={0}
        title={t("bag.shipFreeOver", { amount: String(freeDelivery.threshold) })}
        detail={t("bag.shipStart")}
        badge="0%"
        progressLabel={t("bag.shipProgress")}
      />
    ) : (
      <FreeDeliveryCard
        percent={freeDelivery.percent}
        title={t("bag.shipAdd", { amount: String(freeDelivery.remaining) })}
        detail={t("bag.shipOnOrdersOver", { amount: String(freeDelivery.threshold) })}
        progressLabel={t("bag.shipProgress")}
      />
    )
  ) : undefined;

  const footer = empty ? undefined : (
    <>
      {promoNote ? (
        <p className="text-[13px] text-sapil-ok mb-[6px]" aria-live="polite">
          {promoNote}
        </p>
      ) : null}
      <SummaryRow
        label={t("bag.subtotal")}
        value={
          <>
            {subtotalWas ? (
              <s className="me-[6px] text-[13px] font-[400] text-sapil-muted">
                <span className="sr-only">{t("bag.was")} </span>
                {subtotalWas}
              </s>
            ) : null}
            {subtotal}
          </>
        }
      />
      <SummaryRow label={t("bag.delivery")} value={delivery} />
      <SummaryRow label={t("bag.total")} value={total} variant="total" />
      <Link
        href={checkoutHref}
        aria-disabled={checkoutBlocked || undefined}
        onClick={(event) => {
          if (checkoutBlocked) {
            event.preventDefault();
            return;
          }
          onClose();
        }}
        className={cx(buttonClass("dark"), "w-full !h-[44px]", checkoutBlocked && "opacity-50 cursor-not-allowed")}
      >
        {syncing ? t("bag.updatingBag") : t("bag.checkout")}
      </Link>
      <button
        type="button"
        onClick={onClose}
        className={cx(buttonClass("link"), "table mx-auto mt-[8px] !text-[13px] leading-[1.3]")}
      >
        {t("bag.continueShopping")}
      </button>
    </>
  );

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={t("bag.title")}
      count={count || undefined}
      countLabel={t("bag.items", { count })}
      closeLabel={t("bag.close")}
      ship={ship}
      footer={footer}
    >
      {empty ? (
        <div className="text-center py-[64px] text-sapil-ink-2">
          <b className="block font-sapil-serif font-[400] text-[26px] text-sapil-ink mb-[8px]">{t("bag.emptyTitle")}</b>
          {t("bag.emptyBody")}
          <Button href={shopHref} LinkComponent={Link} onClick={onClose} className="!flex w-fit mx-auto mt-[24px]">
            {t("bag.emptyCta")}
          </Button>
        </div>
      ) : (
        <>
          {lines.map((line) => (
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
              onQuantityChange={(next) => (next < 1 ? onRemove(line.key) : onQuantityChange(line.key, next))}
              total={line.total}
              was={line.was}
              onRemove={() => onRemove(line.key)}
              LinkComponent={Link}
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
              extra={<LineNotes line={line} />}
            />
          ))}
          {gifts.map((gift) => (
            <GiftRow key={gift.key} gift={gift} />
          ))}
        </>
      )}
    </Drawer>
  );
}

function LineNotes({ line }: { line: SapilBagLineData }) {
  const t = useSapilCopy();
  if (!line.tags?.length && !line.stockNote && !line.unavailable) return null;
  return (
    <span className="block mt-[6px] text-[12px] leading-[1.4]">
      {line.tags?.length ? (
        <span className="flex flex-wrap gap-[4px]">
          {line.tags.map((tag) => (
            <span
              key={tag.text}
              className={cx(
                "py-[2px] px-[8px] rounded-full",
                tag.strong ? "bg-sapil-ok-soft text-sapil-ok font-[600]" : "bg-sapil-p-sand text-sapil-ink-2",
              )}
            >
              {tag.text}
            </span>
          ))}
        </span>
      ) : null}
      {line.unavailable ? <span className="block text-sapil-sale">{t("bag.unavailableNote")}</span> : null}
      {line.stockNote ? (
        <span className="block text-sapil-muted" role="status">
          {line.stockNote}
        </span>
      ) : null}
    </span>
  );
}

function GiftRow({ gift }: { gift: SapilBagGiftData }) {
  const t = useSapilCopy();
  if (gift.kind === "notice") {
    return (
      <p className="py-[12px] text-[13px] text-sapil-ink-2 border-b border-sapil-line" role="status">
        {gift.message}
      </p>
    );
  }
  if (gift.kind === "choose") {
    return (
      <div className="flex items-center justify-between gap-[12px] my-[12px] py-[12px] px-[14px] rounded-[14px] bg-sapil-p-mint">
        <b className="text-[14px] font-[600]">{t("bag.giftWaiting")}</b>
        <button type="button" onClick={gift.onChoose} className={cx(buttonClass("add"), "!h-[36px]")}>
          {t("bag.giftChoose")}
        </button>
      </div>
    );
  }
  return (
    <div>
      {gift.gifts.map((item) => (
        <div
          key={item.key}
          aria-label={t("bag.giftItem", { name: item.name })}
          role="group"
          className="grid grid-cols-[72px_1fr_auto] gap-[14px] py-[16px] border-b border-sapil-line items-center"
        >
          <span className="aspect-square rounded-sapil-sm bg-sapil-p-mint grid place-items-center">
            {item.imageSrc ? (
              // eslint-disable-next-line @next/next/no-img-element -- gift thumbnails come from the catalog search
              <img src={item.imageSrc} alt="" className="h-[84%] object-contain" />
            ) : null}
          </span>
          <span>
            <b className="font-sapil-serif font-[400] text-[18px] block leading-[1.2]">{item.name}</b>
            <small className="text-[13px] text-sapil-muted">
              <span className="me-[6px] py-[1px] px-[8px] rounded-full bg-sapil-ok-soft text-sapil-ok font-[600]">
                {t("bag.giftTag")}
              </span>
              {t("bag.giftQty", { count: item.quantity })}
            </small>
          </span>
          <span className="text-end font-[600] tabular-nums">
            {t("bag.giftFree")}
            {item.listPrice ? (
              <s className="block text-[13px] font-[400] text-sapil-muted">
                <span className="sr-only">{t("bag.was")} </span>
                {item.listPrice}
              </s>
            ) : null}
          </span>
        </div>
      ))}
      {gift.onChange ? (
        <button type="button" onClick={gift.onChange} className={cx(buttonClass("link"), "mt-[10px] !text-[13px]")}>
          {t("bag.giftChange")}
        </button>
      ) : null}
    </div>
  );
}
