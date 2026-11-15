"use client";

import { useId } from "react";
import { useShopCopy } from "@/lib/i18n/useShopCopy";
import {
  useCountryMarketSuggestion,
  useCountryPromptClaimed,
} from "@/features/markets/hooks/useCountryMarketSuggestion";

/**
 * "Shopping from Saudi Arabia? Switch to KSA": shown when the shopper's current
 * country has its own market and it is not the one in use. Never switches by
 * itself. Default design; a brand shell can draw its own (useClaimCountryPrompt).
 */
export function CountryMarketPrompt() {
  const claimed = useCountryPromptClaimed();
  const suggestion = useCountryMarketSuggestion();
  const copy = useShopCopy();
  const titleId = useId();
  if (claimed || !suggestion) return null;
  const { suggested, current, countryName, accept, decline } = suggestion;
  return (
    <section
      role="dialog"
      aria-modal="false"
      aria-labelledby={titleId}
      data-country-market-prompt
      className="fixed inset-x-4 bottom-4 z-[1300] mx-auto max-w-md rounded-md border border-bone bg-cream p-5 text-ink shadow-[0_12px_32px_rgba(44,36,29,0.18)] sm:inset-x-auto sm:end-6 sm:bottom-6"
    >
      <h2 id={titleId} className="m-0 text-base font-semibold">
        {copy("market.countryPrompt.title", { country: countryName })}
      </h2>
      <p className="mt-2 mb-4 text-sm text-ink/80">
        {copy("market.countryPrompt.body", { current: current.label, country: countryName })}
      </p>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={accept}
          className="cursor-pointer rounded-md border-0 bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-copper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
        >
          {copy("market.countryPrompt.switch", { market: suggested.label })}
        </button>
        <button
          type="button"
          onClick={decline}
          className="cursor-pointer rounded-md border border-ink/30 bg-transparent px-4 py-2 text-sm font-semibold text-ink hover:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
        >
          {copy("market.countryPrompt.stay", { market: current.label })}
        </button>
      </div>
    </section>
  );
}
