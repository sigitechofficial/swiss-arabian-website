import type { ReactNode } from "react";

type CenteredSectionHeadProps = {
  eyebrow: string;
  title: ReactNode;
};

/** Centered section title — Figma Gift Sets section heads */
export function CenteredSectionHead({
  eyebrow,
  title,
}: CenteredSectionHeadProps) {
  return (
    <div className="mx-auto w-full max-w-[1280px] border-b border-sa-border px-4 pb-3.5 text-center sm:px-6 lg:px-10">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gold">
        {eyebrow}
      </p>
      <h2 className="mt-3 font-sans text-[clamp(2rem,4vw,3.2rem)] font-medium tracking-tight text-sa-primary">
        {title}
      </h2>
    </div>
  );
}

export function Accent({ children }: { children: ReactNode }) {
  return <em className="font-medium italic text-terra">{children}</em>;
}
