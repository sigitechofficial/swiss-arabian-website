"use client";

import { useState } from "react";

import {
  Accent,
  CenteredSectionHead,
} from "@/features/gift-box/components/CenteredSectionHead";
import { faqItems } from "@/features/subscriptions/data/subscriptionContent";

/** Figma · FAQ 336:155 — real button + aria-expanded */
export function SubscriptionFaq() {
  const [openId, setOpenId] = useState<string | null>(faqItems[0]?.id ?? null);

  return (
    <section className="px-4 pt-14 sm:px-6 lg:px-10" aria-labelledby="faq-heading">
      <CenteredSectionHead
        eyebrow="Support"
        title={
          <>
            Still have <Accent>questions?</Accent>
          </>
        }
      />

      <div className="mx-auto mt-10 flex max-w-[740px] flex-col gap-3">
        {faqItems.map((item) => {
          const open = openId === item.id;
          return (
            <div
              key={item.id}
              className="border border-sa-border bg-surface px-6 py-[18px]"
            >
              <button
                type="button"
                className="flex w-full items-center gap-4 text-left"
                aria-expanded={open}
                onClick={() => setOpenId(open ? null : item.id)}
              >
                <span className="flex-1 text-[15px] font-bold text-sa-primary">
                  {item.question}
                </span>
                <span className="text-[20px] text-terra" aria-hidden>
                  {open ? "−" : "+"}
                </span>
              </button>
              {open ? (
                <p className="mt-3 text-[13.5px] leading-[1.65] text-sa-secondary">
                  {item.answer}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
