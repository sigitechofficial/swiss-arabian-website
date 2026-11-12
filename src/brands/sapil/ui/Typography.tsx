import type { ElementType, HTMLAttributes, ReactNode } from "react";
import { cx, DefaultLink, type SapilLinkComponent } from "./shared";

/** v9 `.eyebrow`: 12px uppercase kicker. */
export const EYEBROW =
  "font-sapil-sans font-[600] text-[12px] leading-[1.2] tracking-[.14em] uppercase text-sapil-muted";

export function Eyebrow({ className, ...rest }: HTMLAttributes<HTMLParagraphElement>) {
  return <p {...rest} className={cx(EYEBROW, className)} />;
}

/** v9 `.serif`: the Fraunces italic accent inside headings. */
export function Serif({ className, ...rest }: HTMLAttributes<HTMLSpanElement>) {
  return <span {...rest} className={cx("font-sapil-serif italic font-[400]", className)} />;
}

export type SectionHeadProps = {
  eyebrow?: ReactNode;
  /** heading text before the accent, e.g. "Just landed," */
  title: ReactNode;
  /** italic serif ending, e.g. "still fizzing." */
  accent?: ReactNode;
  description?: ReactNode;
  /** right-hand side: links, rail arrows */
  actions?: ReactNode;
  as?: ElementType;
  id?: string;
  className?: string;
};

/** v9 `.sec-head`: eyebrow + serif h2 with an italic accent, optional lead and actions. */
export function SectionHead({ eyebrow, title, accent, description, actions, as: H = "h2", id, className }: SectionHeadProps) {
  return (
    <div className={cx("flex items-end justify-between gap-[24px] mb-[40px] flex-wrap", className)}>
      <div>
        {/* v9 quirk kept on purpose: `.sec-head p` also hits the eyebrow (12px top margin, ink-2) */}
        {eyebrow && <Eyebrow className="mt-[12px] mb-[14px] !text-sapil-ink-2 max-w-[46ch]">{eyebrow}</Eyebrow>}
        <H id={id} className="text-[clamp(34px,4.2vw,56px)]">
          {title}
          {accent && (
            <>
              {" "}
              <Serif>{accent}</Serif>
            </>
          )}
        </H>
        {description && <p className="text-sapil-ink-2 max-w-[46ch] mt-[12px]">{description}</p>}
      </div>
      {actions}
    </div>
  );
}

export type PriceProps = {
  /** formatted price, e.g. "AED 63" (see formatAED) */
  value: ReactNode;
  /** struck-out full price */
  was?: ReactNode;
  /** "card": 16px/500 block as in product cards; "plain": v9 `.price` (600) */
  variant?: "plain" | "card";
  className?: string;
};

/** v9 `.price` with optional `<s>` was-price. */
export function Price({ value, was, variant = "plain", className }: PriceProps) {
  return (
    <span
      className={cx(
        "tabular-nums",
        variant === "card"
          ? "block text-[16px] font-[500] text-sapil-ink max-749:text-[14px]"
          : "font-[600]",
        className,
      )}
    >
      {value}
      {was && (
        <>
          {" "}
          <s className="text-sapil-muted font-[400] text-[.875em] ml-[6px]">
            <span className="sr-only">was </span>
            {was}
          </s>
        </>
      )}
    </span>
  );
}

const STAR_PATH = "m12 2.8 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 16.8l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9Z";

export type StarsProps = {
  /** 0–5; rounded to whole stars like v9 */
  rating: number;
  /** 16 (review card), 18 (product page), 22 (reviews summary) */
  size?: 16 | 18 | 22;
  className?: string;
};

/** v9 `.stars`: filled + outlined stars in --star. Exposed as one image with a text label. */
export function Stars({ rating, size = 18, className }: StarsProps) {
  const n = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <span
      role="img"
      aria-label={`${rating} out of 5 stars`}
      className={cx(
        "flex text-sapil-star",
        size === 22 ? "gap-[4px] [&_svg]:w-[22px] [&_svg]:h-[22px]" : "gap-[3px]",
        size === 18 && "[&_svg]:w-[18px] [&_svg]:h-[18px]",
        size === 16 && "[&_svg]:w-[16px] [&_svg]:h-[16px]",
        className,
      )}
    >
      {Array.from({ length: 5 }, (_, i) => (
        <svg key={i} viewBox="0 0 24 24" aria-hidden="true">
          {i < n ? (
            <path d={STAR_PATH} fill="currentColor" />
          ) : (
            <path d={STAR_PATH} fill="none" stroke="currentColor" strokeWidth="1.6" />
          )}
        </svg>
      ))}
    </span>
  );
}

export type Crumb = { label: ReactNode; href?: string };

/** v9 `.crumbs`: "Home / Blogs". The last item is the current page. */
export function Breadcrumbs({
  items,
  LinkComponent = DefaultLink,
  className,
}: {
  items: Crumb[];
  LinkComponent?: SapilLinkComponent;
  className?: string;
}) {
  return (
    <nav aria-label="Breadcrumb" className={cx("text-[14px] text-sapil-muted pt-[24px]", className)}>
      {items.map((c, i) => {
        const last = i === items.length - 1;
        return (
          <span key={i}>
            {i > 0 && " / "}
            {c.href && !last ? (
              <LinkComponent href={c.href} className="hover:text-sapil-ink">
                {c.label}
              </LinkComponent>
            ) : (
              <span aria-current={last ? "page" : undefined}>{c.label}</span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
