"use client";

import { usePathname } from "next/navigation";
import { isHomePath, isProductPath } from "./homePath";

/**
 * The SEO text heading is the home page's main heading (H1, as SEO asked: the hero
 * title is not a heading there). On category and other pages it is an H2, so pages
 * keep their own single H1 (collection name…). On a product page it is not a heading
 * at all: headings there are for the product's own content (SEO audit p12).
 */
export function FooterSeoHeading({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname() ?? "";
  const Tag = isHomePath(pathname) ? "h1" : isProductPath(pathname) ? "p" : "h2";
  return <Tag className={className}>{children}</Tag>;
}
