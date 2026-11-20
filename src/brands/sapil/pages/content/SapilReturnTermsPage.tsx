"use client";

import { useMarketReturnTerms } from "@/features/afterSales/hooks/useMarketReturnTerms";
import { afterSalesCopyText } from "@/features/afterSales/utils/afterSalesCopy";
import { useShopLocale } from "@/lib/i18n/ShopLocaleProvider";
import { useShopCopy } from "@/lib/i18n/useShopCopy";
import { Wrap } from "../../ui";
import { SapilContentCrumbs } from "../../components/content/SapilContentCrumbs";
import { SapilSkeleton } from "../../components/commerce/shared";

/**
 * `/return-terms` in Sapil's design: the market's return, exchange and
 * cancellation terms today, generated from its after-sales settings (same data
 * as Swiss Arabian, `useMarketReturnTerms`). Linked from the bag and checkout.
 */
export function SapilReturnTermsPage() {
  const t = useShopCopy();
  const locale = useShopLocale();
  const { market, policy } = useMarketReturnTerms();
  const title = t("returnsPolicy.termsPage.title");

  return (
    <div className="pb-[88px]">
      <Wrap>
        <SapilContentCrumbs current={title} />
      </Wrap>
      <article className="max-w-[760px] mx-auto px-sapil-gut">
        <h1 className="font-sapil-display !font-[400] text-[clamp(40px,5vw,72px)] !leading-[1.02] mt-[24px] mb-[16px]">{title}</h1>
        <p className="text-[16px] leading-[1.6] text-sapil-ink-2 mb-[28px]">{t("returnsPolicy.termsPage.intro", { market })}</p>
        <section
          aria-busy={policy.isLoading}
          data-sapil="return-terms"
          className="rounded-[24px] bg-sapil-white p-[28px] shadow-sapil max-600:p-[20px] max-600:rounded-[20px]"
        >
          {policy.data ? (
            <ul className="list-none m-0 p-0 grid gap-[14px]">
              {policy.data.items.map((item) => (
                <li key={`${item.key}.${item.variant}`} className="flex gap-[12px] text-[15px] leading-[1.55] text-sapil-ink">
                  <i aria-hidden="true" className="mt-[9px] w-[6px] h-[6px] shrink-0 rounded-full bg-sapil-accent" />
                  <span>{afterSalesCopyText(item, t, locale)}</span>
                </li>
              ))}
            </ul>
          ) : policy.isError ? (
            <p role="alert" className="m-0 text-[15px] text-sapil-ink-2">
              {t("returnsPolicy.termsPage.loadFailed")}
            </p>
          ) : (
            <div className="grid gap-[12px]" aria-label={t("returnsPolicy.loading")}>
              <SapilSkeleton className="h-[18px] w-[90%]" />
              <SapilSkeleton className="h-[18px] w-[75%]" />
              <SapilSkeleton className="h-[18px] w-[82%]" />
            </div>
          )}
        </section>
      </article>
    </div>
  );
}
