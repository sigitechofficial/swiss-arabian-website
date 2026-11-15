"use client";

import { useId } from "react";
import { useShopCopy } from "@/lib/i18n/useShopCopy";
import {
  useClaimCountryPrompt,
  useCountryMarketSuggestion,
} from "@/features/markets/hooks/useCountryMarketSuggestion";
import { Button } from "../../ui";

/** The market suggestion for the shopper's country in the v9 design (the default prompt hides while this is mounted). */
export function SapilCountryPrompt() {
  useClaimCountryPrompt();
  const suggestion = useCountryMarketSuggestion();
  const copy = useShopCopy();
  const titleId = useId();
  if (!suggestion) return null;
  const { suggested, current, countryName, accept, decline } = suggestion;
  return (
    <section
      role="dialog"
      aria-modal="false"
      aria-labelledby={titleId}
      data-country-market-prompt
      className="fixed inset-x-[16px] bottom-[16px] z-[79] mx-auto max-w-[420px] rounded-[20px] border border-sapil-line bg-sapil-white p-[20px] text-sapil-ink shadow-[0_18px_40px_rgba(0,0,0,.12)] sm:inset-x-auto sm:end-[24px] sm:bottom-[24px]"
    >
      <h2 id={titleId} className="m-0 text-[17px] font-[700]">
        {copy("market.countryPrompt.title", { country: countryName })}
      </h2>
      <p className="mt-[8px] mb-[16px] text-[14px] text-sapil-muted">
        {copy("market.countryPrompt.body", { current: current.label, country: countryName })}
      </p>
      <div className="flex flex-wrap gap-[10px]">
        <Button variant="dark" onClick={accept}>
          {copy("market.countryPrompt.switch", { market: suggested.label })}
        </Button>
        <Button variant="line" onClick={decline}>
          {copy("market.countryPrompt.stay", { market: current.label })}
        </Button>
      </div>
    </section>
  );
}
