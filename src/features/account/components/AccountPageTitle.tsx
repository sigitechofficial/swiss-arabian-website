import { accountContainer } from "../constants/accountLayout";

type AccountPageTitleProps = {
  title: string;
  subtitle?: string;
};

/** Figma · Page-Title (1203:8918 · 1236:9632 · 1318:9991) */
export function AccountPageTitle({ title, subtitle }: AccountPageTitleProps) {
  return (
    <header className={`${accountContainer} pb-4 pt-7 sm:pt-8`}>
      <h1 className="text-[25px] font-bold leading-tight text-sa-primary sm:text-[30px] lg:text-[36px]">
        {title}
      </h1>
      {subtitle ? (
        <p className="mt-2 max-w-[720px] text-[14px] leading-relaxed text-sa-secondary">
          {subtitle}
        </p>
      ) : null}
    </header>
  );
}
