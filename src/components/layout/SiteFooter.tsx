"use client";

import Image from "next/image";
import Link from "next/link";
import { homeAssets } from "@/features/home/constants/homeAssets";
import { useNavigation } from "@/features/navigation/hooks/useNavigation";
import type { NavItem } from "@/features/navigation/types/navigation";

// ─── Hardcoded fallback (shown while API loads or on error) ──────────────

type FooterColumn = {
  heading: string;
  links: { label: string; href: string }[];
};

const FALLBACK_COLUMNS: FooterColumn[] = [
  {
    heading: "Shop",
    links: [
      { label: "Perfumes", href: "/products" },
      { label: "For Him", href: "/products?gender=men" },
      { label: "For Her", href: "/products?gender=women" },
      { label: "Perfume Oils", href: "/products" },
      { label: "Incense", href: "/products" },
      { label: "Gift Sets", href: "/gift-box" },
      { label: "Subscription", href: "/subscriptions" },
    ],
  },
  {
    heading: "Service",
    links: [
      { label: "Exchange & Return", href: "/search" },
      { label: "Shipping & Delivery", href: "/search" },
      { label: "Refund Policy", href: "/search" },
      { label: "Terms", href: "/search" },
      { label: "Privacy", href: "/search" },
    ],
  },
  {
    heading: "House",
    links: [
      { label: "Our Story", href: "/our-story" },
      { label: "FAQ", href: "/faq" },
      { label: "Blog", href: "/blog" },
      { label: "Careers", href: "/search" },
      { label: "Become a Partner", href: "/search" },
    ],
  },
];

const PAYMENTS = ["VISA", "MC", "AMEX", "APPLE PAY", "G PAY"] as const;

// ─── API item → column ────────────────────────────────────────────────────

function navItemsToColumns(items: NavItem[]): FooterColumn[] {
  return items
    .filter((item) => item.type !== "GROUP_HEADER")
    .map((item) => {
      const links = (item.children ?? [])
        .filter((c) => c.type !== "GROUP_HEADER" && c.href)
        .map((c) => ({ label: c.label, href: c.href! }));

      if (item.children?.length) {
        return { heading: item.label, links };
      }
      // Standalone top-level link (no children)
      if (item.href) {
        return { heading: item.label, links: [{ label: item.label, href: item.href }] };
      }
      return null;
    })
    .filter((col): col is FooterColumn => col !== null);
}

// ─── Component ───────────────────────────────────────────────────────────

function FooterNav({ columns }: { columns: FooterColumn[] }) {
  return (
    <>
      {columns.map((col) => (
        <nav key={col.heading} aria-label={col.heading}>
          <h4 className="mb-4 text-[11px] font-bold uppercase tracking-[0.18em] text-gold-light">
            {col.heading}
          </h4>
          <ul className="space-y-2 text-[13.5px] text-cream/60">
            {col.links.map((link) => (
              <li key={link.label}>
                <Link href={link.href} className="hover:text-cream">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ))}
    </>
  );
}

/** Storefront footer — nav columns from /storefront/navigation API */
export function SiteFooter() {
  const { footerItems, isLoading } = useNavigation();

  // Use API columns when loaded; fall back to hardcoded while loading or on error.
  const columns =
    !isLoading && footerItems.length > 0
      ? navItemsToColumns(footerItems)
      : isLoading
        ? FALLBACK_COLUMNS
        : FALLBACK_COLUMNS;

  const hasColumns = columns.length > 0;
  const gridCols = hasColumns
    ? `grid-cols-2 md:grid-cols-${Math.min(columns.length + 1, 5)}`
    : "grid-cols-1";

  return (
    <footer className="bg-inverse text-cream">
      <div
        className={`mx-auto grid max-w-[1280px] gap-9 px-4 py-16 sm:px-6 lg:px-10 ${gridCols}`}
      >
        {/* Brand */}
        <div className={hasColumns ? "col-span-2 md:col-span-1" : ""}>
          <Link
            href="/"
            className="relative block h-[50px] w-[90px]"
            aria-label="Swiss Arabian home"
          >
            <Image
              src={homeAssets.logo}
              alt="Swiss Arabian"
              fill
              className="site-logo-on-dark object-contain object-left"
              sizes="90px"
            />
          </Link>
          <p className="mt-4 max-w-[290px] text-[13.5px] leading-relaxed text-cream/60">
            A house of fragrance founded on duality — Western craft and Oriental
            soul, blended since 1974.
          </p>
        </div>

        {hasColumns ? <FooterNav columns={columns} /> : null}
      </div>

      <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-4 border-t border-cream/15 px-4 py-6 sm:px-6 lg:px-10">
        <p className="text-[12px] text-cream/50">© 2026 Swiss Arabian Global</p>
        <ul className="flex flex-wrap gap-2" aria-label="Payment methods">
          {PAYMENTS.map((method) => (
            <li
              key={method}
              className="border border-cream/25 px-2.5 py-1 text-[10px] font-bold tracking-wide text-cream/60"
            >
              {method}
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
