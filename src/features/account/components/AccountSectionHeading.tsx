import { LocaleLink } from "@/lib/i18n/LocaleLink";

type AccountSectionHeadingProps = {
  title: string;
  linkLabel?: string;
  href?: string;
};

/** Inline title with trailing link */
export function AccountSectionHeading({
  title,
  linkLabel,
  href,
}: AccountSectionHeadingProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h2 className="text-[17px] font-bold text-sa-primary lg:text-[19px]">
        {title}
      </h2>
      {href && linkLabel ? (
        <LocaleLink
          href={href}
          className="text-[12px] font-medium text-sa-primary hover:text-terra"
        >
          {linkLabel} &nbsp;→
        </LocaleLink>
      ) : null}
    </div>
  );
}
