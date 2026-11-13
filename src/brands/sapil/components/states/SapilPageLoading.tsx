"use client";

import "@/brands/sapil/theme.css";
import { SapilRoot } from "../../ui/SapilRoot";
import { cx } from "../../ui/shared";
import { useHasSapilCopy, useSapilCopy } from "../../i18n/SapilCopy";
import { useShopCopy } from "@/lib/i18n/useShopCopy";

/**
 * Sapil's `PageLoading` (route and sign-in-check fallbacks): three pastel
 * bottle tiles pulsing on paper, the v9 loading state, instead of Swiss
 * Arabian's perfume-bottle medallion. Some fallbacks render outside the Sapil
 * shell (sign-in pages), so it brings its own Sapil root.
 *
 * The route's English `label` is not shown: the text is "Loading…" in the
 * page's language (Sapil's wording inside the shell, the shared one outside).
 */
export function SapilPageLoading({ fill = false }: { label?: string; fill?: boolean }) {
  const hasSapilCopy = useHasSapilCopy();
  const t = useSapilCopy();
  const shared = useShopCopy();
  const label = hasSapilCopy ? t("common.loading") : shared("reviews.loading");
  return (
    <SapilRoot
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={cx(
        "flex w-full flex-col items-center justify-center gap-[20px] px-sapil-gut py-[64px] text-sapil-ink",
        fill ? "min-h-[70vh] flex-1" : "min-h-[50vh]",
      )}
    >
      <span aria-hidden="true" className="flex items-end gap-[10px]">
        <span className="block h-[72px] w-[48px] rounded-[14px] bg-sapil-p-pink motion-safe:animate-pulse" />
        <span className="block h-[96px] w-[64px] rounded-[16px] bg-sapil-p-peach motion-safe:animate-pulse [animation-delay:.15s]" />
        <span className="block h-[72px] w-[48px] rounded-[14px] bg-sapil-p-butter motion-safe:animate-pulse [animation-delay:.3s]" />
      </span>
      <p className="font-sapil-sans text-[12px] font-[600] uppercase tracking-[.14em] text-sapil-muted">{label}</p>
    </SapilRoot>
  );
}
