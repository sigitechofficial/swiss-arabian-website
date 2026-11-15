import type { ReactNode } from "react";
import { Serif, cx } from "../../ui";
import type { TextPart } from "./cmsSections";

/** Text with its emphasised part in the italic serif (v9 `.serif`). */
export function PartsText({ parts, serifClassName }: { parts: TextPart[]; serifClassName?: string }) {
  return (
    <>
      {parts.map((p, i) =>
        p.emphasis ? (
          <Serif key={i} className={serifClassName}>
            {p.text}
          </Serif>
        ) : (
          <span key={i}>{p.text}</span>
        ),
      )}
    </>
  );
}

/** A home section (v9 rhythm: 64px top and bottom, 48px at ≤900px). */
export function HomeSection({
  id,
  band,
  className,
  children,
  label,
  labelledBy,
}: {
  id?: string;
  /** white background (v9 `.band`) */
  band?: boolean;
  className?: string;
  children: ReactNode;
  label?: string;
  labelledBy?: string;
}) {
  return (
    <section
      id={id}
      aria-label={label}
      aria-labelledby={labelledBy}
      className={cx("py-[64px] max-900:py-[48px] scroll-mt-[88px]", band && "bg-sapil-white", className)}
    >
      {children}
    </section>
  );
}
