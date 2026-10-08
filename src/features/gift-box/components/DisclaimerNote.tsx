import { giftSetsDisclaimer } from "@/features/gift-box/data/giftBoxContent";

/** Figma · Disclaimer Note */
export function DisclaimerNote() {
  return (
    <aside
      className="bg-cream px-4 py-6 dark:bg-section-soft sm:px-6 lg:px-10"
      aria-label="Disclaimer"
    >
      <div className="mx-auto max-w-[1100px]">
        <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-sa-primary">
          Disclaimer
        </p>
        <p className="mt-2.5 text-[12px] leading-[1.7] text-sa-secondary">
          {giftSetsDisclaimer}
        </p>
      </div>
    </aside>
  );
}
