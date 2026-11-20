"use client";

import { getUserFacingErrorMessage } from "@/lib/api/userFacingErrors";
import { LocaleLink } from "@/lib/i18n/LocaleLink";
import { useShopCopy } from "@/lib/i18n/useShopCopy";

import { useStockAlerts } from "../hooks/useStockAlerts";

/**
 * "Back-in-stock alerts": the products the shopper asked to be emailed about, each with a way to
 * stop it. Stopping one never touches other alerts or marketing consent (D3-4b).
 */
export function AccountStockAlertsSection() {
  const t = useShopCopy();
  const { list, cancel } = useStockAlerts();
  const items = list.data?.items ?? [];

  return (
    <div data-testid="account-stock-alerts">
      <p className="max-w-[660px] text-[12px] text-sa-secondary">{t("stockAlertsBody")}</p>
      {list.isPending ? null : list.isError ? (
        <p className="mt-4 text-[12px] text-red-600">{getUserFacingErrorMessage(list.error)}</p>
      ) : items.length === 0 ? (
        <p className="mt-4 text-[12px] text-sa-secondary">{t("stockAlertsEmpty")}</p>
      ) : (
        <ul className="mt-4 flex flex-col gap-3">
          {items.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-4 text-[13px] text-sa-primary">
              {item.slug ? (
                <LocaleLink href={`/products/${item.slug}`} className="hover:underline">
                  {item.productName}
                </LocaleLink>
              ) : (
                <span>{item.productName}</span>
              )}
              <button
                type="button"
                className="shrink-0 text-[13px] font-semibold text-terra hover:underline disabled:opacity-60"
                disabled={cancel.isPending}
                onClick={() => cancel.mutate(item.id)}
              >
                {t("stockAlertsStop")}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
