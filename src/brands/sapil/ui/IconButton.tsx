import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode, Ref } from "react";
import { cx, DefaultLink, type SapilLinkComponent } from "./shared";

export type IconButtonVariant = "plain" | "outlined";

const BASE =
  "relative w-[44px] h-[44px] grid place-items-center rounded-full [transition:background_.18s] [&_svg]:w-[22px] [&_svg]:h-[22px]";
const VARIANT: Record<IconButtonVariant, string> = {
  // .icon-btn
  plain: "hover:bg-sapil-sand",
  // .rail-ctrl .icon-btn
  outlined: "border border-sapil-line-2 bg-sapil-card disabled:opacity-[.35] disabled:cursor-default",
};

type Common = {
  /** Accessible name; icon buttons have no visible text. */
  label: string;
  variant?: IconButtonVariant;
  /** .bag-count badge (e.g. items in the bag) */
  badge?: number;
  /** replay the .bump animation on the badge (change `key` to re-run) */
  bump?: boolean;
  className?: string;
  children: ReactNode;
};

export type IconButtonProps = Common &
  (
    | ({ href?: undefined; ref?: Ref<HTMLButtonElement> } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children">)
    | ({ href: string; LinkComponent?: SapilLinkComponent } & Omit<
        AnchorHTMLAttributes<HTMLAnchorElement>,
        "href" | "children"
      >)
  );

function Badge({ n, bump }: { n: number; bump?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cx(
        "absolute top-[4px] right-[2px] min-w-[18px] h-[18px] px-[5px] rounded-[9px] bg-sapil-accent text-sapil-white text-[11px] font-[700] grid place-items-center tabular-nums",
        bump && "animate-sapil-bump",
      )}
    >
      {n}
    </span>
  );
}

/** v9 `.icon-btn` (44px round), `.rail-ctrl .icon-btn` when outlined, optional `.bag-count`. */
export function IconButton(props: IconButtonProps) {
  const inner = (
    <>
      {props.children}
      {props.badge !== undefined && <Badge n={props.badge} bump={props.bump} />}
    </>
  );
  if (props.href !== undefined) {
    const { label, variant = "plain", badge: _b, bump: _u, className, children: _c, LinkComponent = DefaultLink, ...rest } = props;
    return (
      <LinkComponent {...rest} aria-label={label} className={cx(BASE, VARIANT[variant], className)}>
        {inner}
      </LinkComponent>
    );
  }
  const { label, variant = "plain", badge: _b, bump: _u, className, children: _c, type = "button", ...rest } = props;
  return (
    <button type={type} {...rest} aria-label={label} className={cx(BASE, VARIANT[variant], className)}>
      {inner}
    </button>
  );
}
