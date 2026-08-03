import Image from "next/image";
import Link from "next/link";

import { homeAssets } from "@/features/home/constants/homeAssets";

const shopLinks = [
  { label: "Perfumes", href: "/products" },
  { label: "For Him", href: "/products?gender=men" },
  { label: "For Her", href: "/products?gender=women" },
  { label: "Perfume Oils", href: "/products" },
  { label: "Incense", href: "/products" },
  { label: "Gift Sets", href: "/gift-box" },
  { label: "Subscription", href: "/subscriptions" },
] as const;

const serviceLinks = [
  { label: "Exchange & Return", href: "/search" },
  { label: "Shipping & Delivery", href: "/search" },
  { label: "Refund Policy", href: "/search" },
  { label: "Terms", href: "/search" },
  { label: "Privacy", href: "/search" },
] as const;

const houseLinks = [
  { label: "Our Story", href: "/#our-story" },
  { label: "FAQ", href: "/search" },
  { label: "Blog", href: "/search" },
  { label: "Careers", href: "/search" },
  { label: "Become a Partner", href: "/search" },
] as const;

const payments = ["VISA", "MC", "AMEX", "APPLE PAY", "G PAY"] as const;

/** Storefront footer — matches home Landing Page 001 */
export function SiteFooter() {
  return (
    <footer className="bg-inverse text-cream">
      <div className="mx-auto grid max-w-[1280px] grid-cols-2 gap-9 px-4 py-16 sm:px-6 md:grid-cols-4 lg:px-10">
        <div className="col-span-2 md:col-span-1">
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
        <nav aria-label="Shop">
          <h4 className="mb-4 text-[11px] font-bold uppercase tracking-[0.18em] text-gold-light">
            Shop
          </h4>
          <ul className="space-y-2 text-[13.5px] text-cream/60">
            {shopLinks.map((item) => (
              <li key={item.label}>
                <Link href={item.href} className="hover:text-cream">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Service">
          <h4 className="mb-4 text-[11px] font-bold uppercase tracking-[0.18em] text-gold-light">
            Service
          </h4>
          <ul className="space-y-2 text-[13.5px] text-cream/60">
            {serviceLinks.map((item) => (
              <li key={item.label}>
                <Link href={item.href} className="hover:text-cream">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="House">
          <h4 className="mb-4 text-[11px] font-bold uppercase tracking-[0.18em] text-gold-light">
            House
          </h4>
          <ul className="space-y-2 text-[13.5px] text-cream/60">
            {houseLinks.map((item) => (
              <li key={item.label}>
                <Link href={item.href} className="hover:text-cream">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-4 border-t border-cream/15 px-4 py-6 sm:px-6 lg:px-10">
        <p className="text-[12px] text-cream/50">© 2026 Swiss Arabian Global</p>
        <ul className="flex flex-wrap gap-2" aria-label="Payment methods">
          {payments.map((method) => (
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
