import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import {
  cx,
  DefaultLink,
  tintStyle,
  type SapilLinkComponent,
  type SapilTint,
} from "./shared";

export type ChipProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  children: ReactNode;
  /** toggle state, exposed as aria-pressed (v9 `.chip[aria-pressed=true]`) */
  pressed?: boolean;
  /** small count after the label (`.chip small`) */
  count?: ReactNode;
  /** colour dot before the label (`.mood-legend .chip i`, uses --c) */
  dot?: SapilTint;
};

/** v9 `.chip`: a 40px filter/toggle pill. Navy when pressed. */
export function Chip({ children, pressed, count, dot, className, style, type = "button", ...rest }: ChipProps) {
  return (
    <button
      type={type}
      aria-pressed={pressed}
      {...rest}
      style={tintStyle("--c", dot, style)}
      className={cx(
        "h-[40px] px-[16px] rounded-full border text-[14px] font-[500] inline-flex items-center gap-[8px] [transition:all_.18s_var(--sapil-ease)]",
        pressed
          ? "bg-sapil-accent border-sapil-accent text-sapil-white"
          : "border-sapil-line-2 bg-sapil-card hover:border-sapil-ink",
        className,
      )}
    >
      {dot && <i aria-hidden="true" className="w-[10px] h-[10px] rounded-full bg-[var(--c)]" />}
      {children}
      {count !== undefined && (
        <small className={cx("text-[12px]", pressed ? "text-sapil-on-dark" : "text-sapil-muted")}>{count}</small>
      )}
    </button>
  );
}

export type SubnavChipProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: string;
  /** pastel background (--c) */
  color: SapilTint;
  /** the page this chip points to is open (aria-current=page, inset ink ring) */
  current?: boolean;
  /** sale chip: text in --sale (`.sn-sale`) */
  sale?: boolean;
  LinkComponent?: SapilLinkComponent;
};

/** v9 `.sn-chip`: pastel 36px link chip in the "Shop by" row. */
export function SubnavChip({ color, current, sale, className, style, LinkComponent = DefaultLink, ...rest }: SubnavChipProps) {
  return (
    <LinkComponent
      aria-current={current ? "page" : undefined}
      {...rest}
      style={tintStyle("--c", color, style)}
      className={cx(
        "inline-flex items-center h-[36px] px-[14px] rounded-[14px] bg-[var(--c)] text-[14px] font-[600] whitespace-nowrap flex-none [transition:filter_.18s] hover:brightness-[.95]",
        current && "shadow-[inset_0_0_0_1.5px_var(--sapil-ink)]",
        sale && "text-sapil-sale",
        className,
      )}
    />
  );
}
