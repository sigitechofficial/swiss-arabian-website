"use client";

import type { ReactNode } from "react";
import { Eyebrow, Serif } from "../../ui";
import { cx } from "../../ui/shared";

/**
 * Design-system form page: a centred white card on paper with a SectionHead-style
 * heading (eyebrow, display title, serif accent). Used by sign-in, account
 * creation, password and tracking forms.
 */
export function FormCard({
  eyebrow,
  title,
  accent,
  lede,
  children,
  footer,
  wide,
  className,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  accent?: ReactNode;
  lede?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
  className?: string;
}) {
  return (
    <div className={cx("mx-auto w-full py-[48px] max-900:py-[28px]", wide ? "max-w-[640px]" : "max-w-[480px]", className)}>
      <div className="bg-sapil-white rounded-[28px] py-[40px] px-[36px] shadow-[0_1px_2px_rgba(60,45,30,.04),0_24px_48px_-32px_rgba(60,45,30,.3)] max-600:py-[28px] max-600:px-[20px] max-600:rounded-[22px]">
        <header className="text-center mb-[24px]">
          {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
          <h1 className="font-sapil-display text-[clamp(32px,3.6vw,44px)] leading-[1.05] mt-[10px]">
            {title}
            {accent ? (
              <>
                {" "}
                <Serif>{accent}</Serif>
              </>
            ) : null}
          </h1>
          {lede ? <p className="mt-[10px] text-[15px] text-sapil-ink-2">{lede}</p> : null}
        </header>
        {children}
      </div>
      {footer ? <div className="mt-[18px] text-center text-[14px] text-sapil-ink-2">{footer}</div> : null}
    </div>
  );
}

/** Inline form message, announced to screen readers. */
export function FormMessage({ tone, children }: { tone: "error" | "ok"; children: ReactNode }) {
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={cx(
        "rounded-[14px] py-[10px] px-[14px] text-[14px] mb-[16px]",
        tone === "error" ? "bg-sapil-p-peach text-sapil-sale" : "bg-sapil-ok-soft text-sapil-ok",
      )}
    >
      {children}
    </p>
  );
}
