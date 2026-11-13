import type { ElementType, HTMLAttributes, ReactNode } from "react";
import { cx, DefaultLink, type SapilLinkComponent, type SapilTint } from "./shared";
import { SubnavChip } from "./Chip";

/** v9 `.wrap`: 1440px max, centred, 24px gutters (16px at ≤900px). */
export function Wrap({
  as: Tag = "div",
  className,
  ...rest
}: HTMLAttributes<HTMLElement> & { as?: ElementType }) {
  return <Tag {...rest} className={cx("max-w-sapil-wrap mx-auto px-sapil-gut", className)} />;
}

export type AnnouncementBarProps = {
  children: ReactNode;
  /** whole bar is a link in v9; omit for a plain bar */
  href?: string;
  LinkComponent?: SapilLinkComponent;
  className?: string;
};

/** v9 `.announce`: mint bar above the header. Use <b> for the highlighted words. */
export function AnnouncementBar({ children, href, LinkComponent = DefaultLink, className }: AnnouncementBarProps) {
  const cls = cx(
    "block bg-sapil-p-mint text-sapil-ink text-[13px] font-[500] text-center py-[10px] px-[16px] [&_b]:font-[700]",
    href && "hover:underline hover:underline-offset-[3px]",
    className,
  );
  return href ? (
    <LinkComponent href={href} className={cls}>
      {children}
    </LinkComponent>
  ) : (
    <div className={cls}>{children}</div>
  );
}

export type SubnavItem = {
  label: ReactNode;
  href: string;
  color: SapilTint;
  current?: boolean;
  sale?: boolean;
};

export type SubnavProps = {
  /** "Shop by" (also the nav's accessible name) */
  label: string;
  items: SubnavItem[];
  /** right-aligned note, hidden at ≤760px */
  info?: ReactNode;
  LinkComponent?: SapilLinkComponent;
  className?: string;
};

/** v9 `.subnav`: white row of pastel chips under the header; scrolls sideways at ≤760px. */
export function Subnav({ label, items, info, LinkComponent, className }: SubnavProps) {
  return (
    <nav aria-label={label} className={cx("bg-sapil-white border-b border-sapil-line", className)}>
      <Wrap className="flex items-center gap-[8px] h-[54px] max-760:overflow-x-auto max-760:[scrollbar-width:none] max-760:[&::-webkit-scrollbar]:hidden max-760:h-[52px]">
        <span className="text-[12px] font-[700] tracking-[.08em] uppercase text-sapil-ink-2 me-[8px] flex-none">
          {label}
        </span>
        {items.map((it) => (
          <SubnavChip
            key={it.href}
            href={it.href}
            color={it.color}
            current={it.current}
            sale={it.sale}
            LinkComponent={LinkComponent}
          >
            {it.label}
          </SubnavChip>
        ))}
        {info && (
          <span className="ms-auto text-[13px] text-sapil-ink-2 whitespace-nowrap max-760:hidden">{info}</span>
        )}
      </Wrap>
    </nav>
  );
}
