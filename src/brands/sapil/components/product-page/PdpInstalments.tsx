"use client";

import { useInstalmentPlan } from "@/features/catalog/hooks/useInstalmentPlan";
import { useSapilCopy } from "../../i18n/SapilCopy";
import { Button, Dialog } from "../../ui";
import { ChevronIcon } from "../../ui/shared";

/**
 * Pay in 4 with Tabby / Tamara under the buy row (shared instalment logic;
 * Sapil look). Tabby opens Tabby's own pop-up; Tamara opens the schedule.
 */
export function PdpInstalments({
  price,
  currency,
  money,
}: {
  price: number;
  currency: string;
  money: (n: number) => string;
}) {
  const t = useSapilCopy();
  const plan = useInstalmentPlan(price, currency);
  const provider = plan.providers.find((p) => p.id === plan.open);
  const when = [
    t("product.payToday"),
    t("product.payInMonths", { count: 1 }),
    t("product.payInMonths", { count: 2 }),
    t("product.payInMonths", { count: 3 }),
  ];

  return (
    <section
      aria-label={t("product.payInFour")}
      className="mt-[14px] bg-sapil-white rounded-[16px] p-[14px] flex items-center gap-[12px] flex-wrap"
    >
      <p className="text-[14px] text-sapil-ink-2 me-auto">
        <span className="font-[600] text-sapil-ink">{t("product.payInFour")}</span>
        {" · "}
        {t("product.payInFourOffer", { amount: money(plan.each) })}
        <span className="ms-[8px] inline-block rounded-full bg-sapil-ok-soft text-sapil-ok text-[12px] font-[600] py-[2px] px-[8px]">
          {t("product.zeroInterest")}
        </span>
      </p>
      <div className="flex gap-[8px]">
        {plan.providers.map((p) => (
          <button
            key={p.id}
            type="button"
            aria-haspopup="dialog"
            onClick={(event) => plan.openProvider(p.id, event.currentTarget)}
            className="inline-flex items-center gap-[4px] h-[36px] ps-[12px] pe-[8px] rounded-full border border-sapil-line-2 bg-sapil-card text-[13px] font-[600] hover:border-sapil-ink [&_svg]:w-[14px] [&_svg]:h-[14px] rtl:[&_svg]:-scale-x-100"
          >
            {p.name}
            <span className="sr-only"> {t("product.learnMoreAbout", { name: p.name })}</span>
            <ChevronIcon dir="right" />
          </button>
        ))}
      </div>
      {plan.openTabbyPopup && plan.tabbyUrl ? (
        <Dialog open onClose={plan.close} label={t("product.tabbyPlans")} closeLabel={t("product.close")}>
          <iframe
            src={plan.tabbyUrl}
            title={t("product.tabbyPlans")}
            className="block w-full h-[min(640px,calc(100vh-96px))] border-0 rounded-[24px]"
            sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
            referrerPolicy="strict-origin-when-cross-origin"
          />
          {provider && !provider.live ? (
            <p className="px-[24px] pb-[20px] text-[14px] text-sapil-ink-2">{t("product.paySoon", { name: provider.name })}</p>
          ) : null}
        </Dialog>
      ) : provider ? (
        <Dialog open onClose={plan.close} label={t("product.payTitle")} closeLabel={t("product.close")}>
          <div className="p-[40px] max-600:p-[24px]">
            <p className="text-[12px] font-[600] tracking-[.14em] uppercase text-sapil-muted">{provider.name}</p>
            <h2 className="text-[32px] mt-[8px] mb-[8px]">{t("product.payTitle")}</h2>
            <p className="text-[15px] text-sapil-ink-2">
              {t("product.payLede", { price: money(price), name: provider.name })}
            </p>
            <ol aria-label={t("product.paySchedule")} className="list-none p-0 grid grid-cols-4 gap-[10px] my-[24px] max-600:grid-cols-2">
              {plan.payments.map((amount, i) => (
                <li key={i} className="bg-sapil-white rounded-[16px] p-[14px] text-center">
                  <p className="font-[700] text-[17px] tabular-nums">{money(amount)}</p>
                  <p className="text-[13px] text-sapil-muted">{when[i]}</p>
                </li>
              ))}
            </ol>
            {!provider.live ? <p className="text-[14px] text-sapil-ink-2 mb-[8px]">{t("product.paySoon", { name: provider.name })}</p> : null}
            <p className="text-[13px] text-sapil-muted mb-[20px]">{t("product.payNote", { name: provider.name })}</p>
            <Button onClick={plan.close}>{t("product.payDone")}</Button>
          </div>
        </Dialog>
      ) : null}
    </section>
  );
}
