"use client";

import { useState } from "react";
import { type StockAlertProduct, useStockAlert } from "@/features/catalog/hooks/useStockAlert";
import { useShopCopy } from "@/lib/i18n/useShopCopy";
import { Button, Dialog, Field, cx } from "../../ui";

/**
 * v9 "Notify me when available": opens a dialog that saves the shopper's email
 * against the product (same request as Swiss Arabian, `useStockAlert`).
 */
export function SapilStockAlert({
  product,
  className,
  compact = false,
}: {
  product: StockAlertProduct;
  className?: string;
  /** product cards: shorter label */
  compact?: boolean;
}) {
  const t = useShopCopy();
  const [open, setOpen] = useState(false);
  const alert = useStockAlert(product);

  return (
    <>
      <button
        type="button"
        data-sapil="stock-alert"
        onClick={(event) => {
          // Cards are links: the button opens the dialog, not the product page.
          event.preventDefault();
          event.stopPropagation();
          setOpen(true);
        }}
        className={className}
      >
        {compact ? t("stockAlert.notifyMe") : t("stockAlert.notifyWhenAvailable")}
      </button>
      {open ? (
        <Dialog open onClose={() => setOpen(false)} label={t("stockAlert.title")} closeLabel={t("stockAlert.close")} className="!w-[min(480px,calc(100%-32px))]">
          <div className="p-[32px] max-600:p-[22px]">
            <p role="heading" aria-level={2} className="sapil-h text-[28px]">
              {t("stockAlert.title")}
            </p>
            <p className="text-[15px] text-sapil-ink-2 mt-[6px]">{product.title}</p>
            {alert.done ? (
              <p role="status" className="mt-[20px] text-[15px] leading-[1.55] text-sapil-ok font-[600]">
                {t("stockAlert.done", { email: alert.email.trim() })}
              </p>
            ) : (
              <form onSubmit={(event) => void alert.submit(event)} className="mt-[20px] grid gap-[14px]">
                <Field
                  id="sapil-stock-alert-email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  dir="ltr"
                  label={t("stockAlert.emailLabel")}
                  placeholder={t("stockAlert.emailPlaceholder")}
                  value={alert.email}
                  onChange={(event) => alert.setEmail(event.target.value)}
                  error={alert.error || undefined}
                />
                <Button type="submit" disabled={alert.busy} className={cx("w-full", alert.busy && "opacity-60 cursor-wait")}>
                  {alert.busy ? t("stockAlert.saving") : t("stockAlert.notifyMe")}
                </Button>
              </form>
            )}
          </div>
        </Dialog>
      ) : null}
    </>
  );
}
