import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { cx, DefaultLink, type SapilLinkComponent } from "./shared";

export type ButtonVariant = "dark" | "line" | "link" | "add";

// Class strings are written out in full so Tailwind's scanner can see them.
// .btn
const BTN =
  "inline-flex items-center justify-center gap-[8px] h-[48px] px-[24px] rounded-full font-[600] text-[15px] [transition:background_.18s_var(--sapil-ease),color_.18s_var(--sapil-ease),transform_.18s_var(--sapil-ease),box-shadow_.18s_var(--sapil-ease)] active:[transform:scale(.97)] disabled:opacity-50 disabled:cursor-not-allowed";
const VARIANT: Record<ButtonVariant, string> = {
  // .btn.btn-dark
  dark: `${BTN} bg-sapil-accent text-sapil-white hover:bg-sapil-accent-2`,
  // .btn.btn-line
  line: `${BTN} border border-sapil-line-2 bg-sapil-card hover:border-sapil-ink`,
  // .link
  link: "font-[600] text-[15px] border-b border-current pb-[2px] [transition:color_.18s] hover:text-sapil-accent",
  // .add
  add: "h-[40px] px-[16px] rounded-full bg-sapil-accent text-sapil-white font-[600] text-[14px] [transition:background_.18s_var(--sapil-ease),transform_.18s_var(--sapil-ease)] active:[transform:scale(.95)]",
};

/** Class string for a v9 button, for elements the component cannot render (e.g. a <summary>). */
export function buttonClass(variant: ButtonVariant = "dark", done = false): string {
  return cx(VARIANT[variant], done && variant === "add" && "!bg-sapil-ok");
}

type Common = {
  variant?: ButtonVariant;
  /** .add.done: the green "Added" state */
  done?: boolean;
  className?: string;
  children?: ReactNode;
};

export type ButtonProps = Common &
  (
    | ({ href?: undefined } & ButtonHTMLAttributes<HTMLButtonElement>)
    | ({ href: string; LinkComponent?: SapilLinkComponent } & Omit<
        AnchorHTMLAttributes<HTMLAnchorElement>,
        "href"
      >)
  );

/** v9 `.btn-dark` / `.btn-line` / `.link` / `.add`. Renders a link when `href` is set. */
export function Button(props: ButtonProps) {
  if (props.href !== undefined) {
    const { variant = "dark", done, className, LinkComponent = DefaultLink, ...rest } = props;
    return <LinkComponent {...rest} className={cx(buttonClass(variant, done), className)} />;
  }
  const { variant = "dark", done, className, type = "button", ...rest } = props;
  return <button type={type} {...rest} className={cx(buttonClass(variant, done), className)} />;
}
