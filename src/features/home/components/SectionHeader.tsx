import Link from "next/link";
import type { ReactNode } from "react";

type SectionHeaderProps = {
  eyebrow: string;
  title: ReactNode;
  href?: string;
  linkLabel?: string;
  aside?: ReactNode;
};

export function SectionHeader({
  eyebrow,
  title,
  href,
  linkLabel,
  aside,
}: SectionHeaderProps) {
  return (
    <div className="mb-10 flex flex-wrap items-end justify-between gap-3 border-b border-sa-border pb-3.5">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-gold">
          {eyebrow}
        </p>
        <h2 className="mt-2 font-sans text-4xl font-medium tracking-tight text-sa-primary lg:text-5xl">
          {title}
        </h2>
      </div>
      {aside
        ? aside
        : href && linkLabel
          ? (
              <Link
                href={href}
                className="border-b-2 border-terra pb-1 text-[12px] font-semibold uppercase tracking-[0.12em] text-sa-primary"
              >
                {linkLabel}
              </Link>
            )
          : null}
    </div>
  );
}

export function Accent({ children }: { children: ReactNode }) {
  return <em className="font-normal italic text-terra">{children}</em>;
}
