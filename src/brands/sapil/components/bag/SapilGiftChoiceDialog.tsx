"use client";

import type { GiftChoiceModalProps } from "@/features/promotions/components/GiftChoiceModal";
import { useGiftChoiceDialog, type GiftChoiceError } from "@/features/promotions/hooks/useGiftChoiceDialog";
import { useSapilCopy, type SapilTranslator } from "../../i18n/SapilCopy";
import { Button, Dialog, EYEBROW, Serif, cx } from "../../ui";

function errorText(t: SapilTranslator, error: GiftChoiceError): string {
  switch (error.code) {
    case "GIFT_UNAVAILABLE":
      return t("bag.giftUnavailable");
    case "GIFT_REMOVED":
      return t("bag.giftRemoved");
    case "PROMOTION_INELIGIBLE":
    case "GIFT_INELIGIBLE":
    case "NO_LONGER_QUALIFIES":
      return t("bag.giftIneligible");
    default:
      return t("bag.giftFailed");
  }
}

/**
 * Sapil's free-gift choice (opened by the shared `GiftChoiceHost` when a
 * promotion lets the shopper pick a gift): the v9 dialog with gift tiles on
 * pastel. Logic is shared (`useGiftChoiceDialog`).
 */
export function SapilGiftChoiceDialog({ award, celebrate, onClose }: GiftChoiceModalProps) {
  const t = useSapilCopy();
  const dialog = useGiftChoiceDialog(award, onClose);
  return (
    <Dialog open onClose={onClose} label={t("bag.giftKicker")} closeLabel={t("bag.giftLater")}>
      <div className={cx("p-[32px] max-600:p-[20px]", celebrate && "motion-safe:animate-sapil-pop")}>
        <p className={EYEBROW}>{t("bag.giftKicker")}</p>
        <h2 className="font-sapil-display !font-[400] text-[clamp(32px,4vw,48px)] !leading-[1] mt-[10px] mb-[10px]">
          {t("bag.giftTitle")} <Serif>{t("bag.giftAccent")}</Serif>
        </h2>
        <p className="text-[15px] text-sapil-ink-2 mb-[20px]">{t("bag.giftLede")}</p>
        <ul aria-label={t("bag.giftChoices")} className="list-none grid grid-cols-3 gap-[16px] max-600:grid-cols-2">
          {dialog.gifts.map((gift) => (
            <li key={gift.sku} className="flex flex-col items-center text-center gap-[8px]">
              <span className="grid aspect-square w-full place-items-center overflow-hidden rounded-[16px] bg-sapil-p-butter">
                {gift.image ? (
                  // eslint-disable-next-line @next/next/no-img-element -- gift images come from the cart API (any host)
                  <img src={gift.image} alt="" width={128} height={128} className="h-full w-full object-contain p-[10px]" />
                ) : null}
              </span>
              <span className="text-[14px] font-[600] leading-[1.3]">{gift.title}</span>
              <Button variant="add" disabled={dialog.pending} onClick={() => void dialog.select(gift.sku)}>
                <span className="sr-only">{gift.title}: </span>
                {t("bag.giftSelect")}
              </Button>
            </li>
          ))}
        </ul>
        {dialog.error ? (
          <p role="alert" className="mt-[16px] text-[14px] text-sapil-sale">
            {errorText(t, dialog.error)}
          </p>
        ) : null}
        <Button variant="link" className="mt-[20px]" onClick={onClose}>
          {t("bag.giftLater")}
        </Button>
      </div>
    </Dialog>
  );
}
