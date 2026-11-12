import type { CSSProperties, ElementType, HTMLAttributes } from "react";
import { cx } from "./shared";
import { sapilFontFamilies, sapilFontVariables } from "../fonts";

/**
 * Root of every Sapil page/subtree: sets data-brand="sapil" (which scopes every token in
 * theme.css) and the next/font variables. Sapil components render correctly only inside it.
 * The route that renders it must also import "@/brands/sapil/theme.css".
 */
export function SapilRoot({
  as: Tag = "div",
  className,
  style,
  ...rest
}: HTMLAttributes<HTMLElement> & { as?: ElementType }) {
  return (
    <Tag
      data-brand="sapil"
      {...rest}
      style={{ ...(sapilFontFamilies as CSSProperties), ...style }}
      className={cx(sapilFontVariables, className)}
    />
  );
}
