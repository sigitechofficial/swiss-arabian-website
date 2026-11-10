"use client";

import { usePathname } from "next/navigation";
import { isHomePath } from "./homePath";

/**
 * The SEO text heading is the home page's main heading (H1, as SEO asked: the hero
 * title is not a heading there). On every other page it is an H2, so pages keep
 * their own single H1 (product name, collection name…).
 */
export function FooterSeoHeading({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname() ?? "";
  const Tag = isHomePath(pathname) ? "h1" : "h2";
  return <Tag className={className}>{children}</Tag>;
}
