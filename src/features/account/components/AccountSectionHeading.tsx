import Link from "next/link";

type AccountSectionHeadingProps = {
  title: string;
  linkLabel?: string;
  href?: string;
};

/** Figma · sect-hd (1110:9333) — inline title with trailing link */
export function AccountSectionHeading({
  title,
  linkLabel,
  href,
}: AccountSectionHeadingProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h2 className="text-[19px] font-bold text-sa-primary lg:text-[22px]">
        {title}
      </h2>
      {href && linkLabel ? (
        <Link
          href={href}
          className="text-[13px] font-medium text-sa-primary hover:text-terra"
        >
          {linkLabel} &nbsp;→
        </Link>
      ) : null}
    </div>
  );
}
