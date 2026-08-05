import { accountContainer } from "../constants/accountLayout";

type AccountSectionHeadProps = {
  eyebrow: string;
  title: string;
  /** Rendered in gold next to the title, as in the Figma two-tone headings. */
  accent: string;
};

/** Figma · section-head (1098:9670 · 1098:9674) */
export function AccountSectionHead({
  eyebrow,
  title,
  accent,
}: AccountSectionHeadProps) {
  return (
    <div className={`${accountContainer} pb-5 pt-9`}>
      <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-gold">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-[24px] font-bold leading-tight text-sa-primary lg:text-[28px]">
        {title} <span className="text-gold-light">{accent}</span>
      </h2>
    </div>
  );
}
