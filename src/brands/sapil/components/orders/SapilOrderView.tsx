"use client";

import type { CSSProperties, ReactNode } from "react";
import { Breadcrumbs, Eyebrow, Wrap, type Crumb } from "../../ui";
import { CheckIcon, cx } from "../../ui/shared";
import { useSapilCopy } from "../../i18n/SapilCopy";
import { DEFAULT_TILE, SapilLink } from "../commerce/shared";

export type OrderTone = "ok" | "pending" | "failed" | "info";

export type OrderStep = { key: string; label: string; detail?: string; state: "done" | "next" | "todo" };

export type OrderLineView = {
  key: string;
  name: string;
  href?: string;
  imageSrc?: string;
  meta: ReactNode;
  price: ReactNode;
  extra?: ReactNode;
};

export type OrderTotalRow = { key: string; label: ReactNode; value: ReactNode; tone?: "save" };

const HERO_BG: Record<OrderTone, string> = {
  ok: "bg-sapil-p-mint",
  pending: "bg-sapil-p-butter",
  failed: "bg-sapil-p-peach",
  info: "bg-sapil-p-sky",
};

function HeroMark({ tone }: { tone: OrderTone }) {
  return (
    <span
      aria-hidden="true"
      className={cx(
        "w-[72px] h-[72px] rounded-full bg-sapil-white grid place-items-center shadow-[0_10px_24px_-14px_rgba(31,122,77,.5)] [&_svg]:w-[34px] [&_svg]:h-[34px] max-900:w-[56px] max-900:h-[56px]",
        tone === "failed" ? "text-sapil-sale" : tone === "pending" ? "text-sapil-star" : "text-sapil-ok",
      )}
    >
      {tone === "failed" ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
          <path d="m7 7 10 10M17 7 7 17" />
        </svg>
      ) : tone === "pending" ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          <circle cx="12" cy="12" r="8" />
          <path d="M12 8v4.5l3 2" />
        </svg>
      ) : (
        <CheckIcon />
      )}
    </span>
  );
}

/**
 * v9 order page (`.od`): thank-you / status hero, delivery tracker, items with
 * totals, delivery and payment cards, help. Used by the confirmation page, the
 * account order detail and guest tracking; every value comes from the order APIs.
 */
export function SapilOrderView({
  crumbs,
  tone,
  eyebrow,
  headline,
  intro,
  highlight,
  steps,
  stopped,
  notices,
  itemsTitle,
  lines,
  totals,
  grandTotal,
  vatNote,
  side,
  after,
  actions,
}: {
  crumbs: Crumb[];
  tone: OrderTone;
  eyebrow: ReactNode;
  headline: ReactNode;
  intro?: ReactNode;
  /** the white box on the right of the hero (`.od-eta`) */
  highlight?: { label: ReactNode; value: ReactNode; detail?: ReactNode };
  steps?: OrderStep[];
  /** shown instead of the tracker when the order left the delivery path */
  stopped?: ReactNode;
  notices?: ReactNode;
  itemsTitle?: ReactNode;
  lines?: OrderLineView[];
  totals?: OrderTotalRow[];
  grandTotal?: { label: ReactNode; value: ReactNode };
  vatNote?: ReactNode;
  side?: ReactNode;
  after?: ReactNode;
  actions?: ReactNode;
}) {
  const t = useSapilCopy();
  return (
    <Wrap className="pb-[72px]">
      <Breadcrumbs label={t("content.breadcrumb")} items={crumbs} LinkComponent={SapilLink} className="pt-[20px]" />
      <header
        className={cx(
          "grid grid-cols-[auto_minmax(0,1fr)_auto] gap-[28px] items-center rounded-[32px] py-[40px] px-[44px] mt-[24px] mb-[20px]",
          "max-900:grid-cols-[1fr] max-900:py-[28px] max-900:px-[22px] max-900:gap-[16px] max-900:rounded-[24px]",
          HERO_BG[tone],
        )}
      >
        <HeroMark tone={tone} />
        <div className="min-w-0">
          <Eyebrow>{eyebrow}</Eyebrow>
          <h1 className="font-sapil-display font-[400] text-[clamp(36px,4vw,56px)] leading-[1.02] mt-[10px] mb-[12px] [&_.serif]:font-sapil-serif">
            {headline}
          </h1>
          {intro ? <p className="text-sapil-ink-2 max-w-[62ch]">{intro}</p> : null}
        </div>
        {highlight ? (
          <div className="bg-sapil-white rounded-[22px] py-[20px] px-[24px] text-center min-w-[190px] max-900:text-start max-900:min-w-0">
            <small className="block text-[12px] font-[600] tracking-[.1em] uppercase text-sapil-muted">{highlight.label}</small>
            <b className="block font-sapil-sans font-[700] text-[26px] leading-[1.2] tracking-[-.02em] mt-[6px] mb-[2px] tabular-nums">
              {highlight.value}
            </b>
            {highlight.detail ? <span className="text-[13px] text-sapil-ink-2">{highlight.detail}</span> : null}
          </div>
        ) : null}
      </header>

      {steps?.length ? (
        <ol
          aria-label={t("account.odStatus")}
          style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}
          className="list-none grid bg-sapil-white rounded-[24px] py-[26px] px-[28px] mb-[20px] max-900:!grid-cols-[1fr] max-900:p-[20px]"
        >
          {steps.map((step, index) => (
            <li
              key={step.key}
              aria-current={step.state === "next" ? "step" : undefined}
              className={cx(
                "relative flex flex-col gap-[4px] pt-[42px] max-900:pt-0 max-900:pb-[22px] max-900:ps-[46px] max-900:min-h-[52px]",
                // the line to the next step (horizontal on desktop, vertical on phones)
                "before:content-[''] before:absolute before:top-[13px] before:start-0 before:end-0 before:h-[3px]",
                "max-900:before:top-0 max-900:before:bottom-0 max-900:before:start-[13px] max-900:before:end-auto max-900:before:w-[3px] max-900:before:h-auto",
                index === 0 && "before:start-[14px] max-900:before:top-[14px] max-900:before:start-[13px]",
                index === steps.length - 1 && "before:end-auto before:w-[14px] max-900:before:hidden",
                step.state === "done" ? "before:bg-sapil-ok-2" : "before:bg-sapil-line",
              )}
            >
              <i
                aria-hidden="true"
                className={cx(
                  "absolute top-0 start-0 w-[29px] h-[29px] rounded-full grid place-items-center z-[1] border-2 not-italic [&_svg]:w-[15px] [&_svg]:h-[15px]",
                  step.state === "done"
                    ? "bg-sapil-ok-2 border-sapil-ok-2 text-sapil-white"
                    : step.state === "next"
                      ? "bg-sapil-white border-sapil-ok-2 shadow-[0_0_0_5px_var(--sapil-ok-soft)]"
                      : "bg-sapil-white border-sapil-line-2",
                )}
              >
                {step.state === "done" ? <CheckIcon /> : null}
              </i>
              <b className="text-[15px] font-[600]">{step.label}</b>
              {step.detail ? <small className="text-[13px] text-sapil-muted">{step.detail}</small> : null}
            </li>
          ))}
        </ol>
      ) : stopped ? (
        <p className="bg-sapil-white rounded-[24px] py-[20px] px-[26px] mb-[20px] text-sapil-ink-2" role="status">
          {stopped}
        </p>
      ) : null}

      {notices}

      {lines ? (
        <div className="grid grid-cols-[minmax(0,7fr)_minmax(0,5fr)] gap-[20px] items-start max-900:grid-cols-[1fr]">
          <section className="bg-sapil-white rounded-[24px] py-[24px] px-[26px] max-900:p-[20px]" aria-labelledby="od-items">
            <h2 id="od-items" className="font-sapil-sans font-[700] text-[20px] leading-[normal] tracking-[-.02em] mb-[6px]">
              {itemsTitle}
            </h2>
            <ul className="list-none">
              {lines.map((line) => {
                const thumb = (
                  <span
                    style={{ "--sapil-tile": `var(--sapil-p-${DEFAULT_TILE})` } as CSSProperties}
                    className="aspect-square rounded-[16px] bg-sapil-tile grid place-items-center"
                  >
                    {line.imageSrc ? (
                      // eslint-disable-next-line @next/next/no-img-element -- order images come from the API as-is
                      <img src={line.imageSrc} alt="" className="h-[86%] object-contain" />
                    ) : null}
                  </span>
                );
                return (
                  <li key={line.key} className="grid grid-cols-[76px_1fr_auto] gap-[16px] items-center py-[14px] border-b border-sapil-line">
                    {line.href ? (
                      <SapilLink href={line.href} tabIndex={-1} aria-hidden="true">
                        {thumb}
                      </SapilLink>
                    ) : (
                      thumb
                    )}
                    <div className="min-w-0">
                      {line.href ? (
                        <SapilLink href={line.href} className="block font-[600] text-[16px]">
                          {line.name}
                        </SapilLink>
                      ) : (
                        <span className="block font-[600] text-[16px]">{line.name}</span>
                      )}
                      <small className="block text-[13px] text-sapil-muted mt-[2px] mb-[6px]">{line.meta}</small>
                      {line.extra}
                    </div>
                    <span className="font-[600] tabular-nums text-end">{line.price}</span>
                  </li>
                );
              })}
            </ul>
            {totals ? (
              <dl className="mt-[14px] border-t border-sapil-line pt-[12px]">
                {totals.map((row) => (
                  <div
                    key={row.key}
                    className={cx(
                      "flex justify-between gap-[16px] py-[5px] text-[15px]",
                      row.tone === "save" ? "text-sapil-ok" : "text-sapil-ink-2",
                    )}
                  >
                    <dt>{row.label}</dt>
                    <dd className={cx("font-[500] tabular-nums whitespace-nowrap", row.tone === "save" ? "text-sapil-ok" : "text-sapil-ink")}>
                      {row.value}
                    </dd>
                  </div>
                ))}
                {grandTotal ? (
                  <div className="flex justify-between gap-[16px] border-t border-sapil-line mt-[8px] pt-[14px] pb-[5px] text-[18px] text-sapil-ink font-[600]">
                    <dt>{grandTotal.label}</dt>
                    <dd className="text-[26px] font-[700] tracking-[-.02em] tabular-nums whitespace-nowrap">{grandTotal.value}</dd>
                  </div>
                ) : null}
              </dl>
            ) : null}
            {vatNote ? <p className="text-[13px] text-sapil-muted text-end">{vatNote}</p> : null}
          </section>
          <aside className="flex flex-col gap-[20px]">{side}</aside>
        </div>
      ) : null}

      {after}
      {actions ? <div className="flex items-center gap-[24px] flex-wrap mt-[36px]">{actions}</div> : null}
    </Wrap>
  );
}

/** Side card (v9 `.od-card` with an uppercase `h3`). */
export function OrderSideCard({ title, children, help }: { title: ReactNode; children: ReactNode; help?: boolean }) {
  return (
    <div className={cx("rounded-[24px] py-[24px] px-[26px] max-900:p-[20px] text-[15px] leading-[1.55]", help ? "bg-sapil-p-sky" : "bg-sapil-white")}>
      <h3 className="font-sapil-sans font-[600] text-[13px] leading-[normal] tracking-[.1em] uppercase text-sapil-muted mb-[10px]">{title}</h3>
      {children}
    </div>
  );
}

/** Loading / polling / error card on the order pages. */
export function OrderStateCard({ title, body, actions, busy }: { title: ReactNode; body?: ReactNode; actions?: ReactNode; busy?: boolean }) {
  return (
    <Wrap className="pt-[32px] pb-[88px]">
      <div className="bg-sapil-white rounded-[28px] py-[56px] px-[40px] text-center max-900:py-[40px] max-900:px-[20px]" aria-busy={busy || undefined}>
        {busy ? (
          <span aria-hidden="true" className="block mx-auto mb-[18px] w-[36px] h-[36px] rounded-full border-[3px] border-sapil-line border-t-sapil-accent motion-safe:animate-spin" />
        ) : null}
        <h1 className="text-[clamp(30px,3.4vw,40px)] mb-[10px]" role={busy ? "status" : undefined}>
          {title}
        </h1>
        {body ? <p className="text-sapil-ink-2 mb-[24px]">{body}</p> : null}
        {actions ? <div className="flex gap-[10px] justify-center flex-wrap">{actions}</div> : null}
      </div>
    </Wrap>
  );
}
