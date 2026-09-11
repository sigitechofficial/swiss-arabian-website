import { accountContainer } from "../constants/accountLayout";

type AccountSectionHeadProps = {
  eyebrow: string;
  title: string;
  /** Rendered in gold next to the title, as in the two-tone headings. */
  accent: string;
};

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
      <h2 className="mt-2 text-[21px] font-bold leading-tight text-sa-primary lg:text-[24px]">
        {title} <span className="text-gold-light">{accent}</span>
      </h2>
    </div>
  );
}
