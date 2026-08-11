import Link from "next/link";
import { StorefrontShell } from "@/components/layout/StorefrontShell";

export const metadata = {
  title: "Page Not Found",
};

export default function NotFound() {
  return (
    <StorefrontShell>
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        {/* 404 number */}
        <p className="font-sans text-[120px] font-bold leading-none tracking-[-0.04em] text-sa-border sm:text-[160px]">
          404
        </p>

        {/* Divider */}
        <div className="mx-auto my-8 h-px w-16 bg-terra" />

        {/* Heading */}
        <h1 className="font-sans text-[22px] font-bold tracking-tight text-sa-primary sm:text-[28px]">
          This page could not be found
        </h1>

        {/* Sub-copy */}
        <p className="mx-auto mt-4 max-w-[380px] text-[14px] leading-relaxed text-sa-muted">
          The page you are looking for may have been moved, deleted, or never
          existed. Let us help you find your next favourite scent.
        </p>

        {/* CTAs */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center bg-terra px-8 text-[12px] font-semibold uppercase tracking-[0.1em] text-white transition-colors hover:bg-[#a25e48]"
          >
            Back to Home
          </Link>
          <Link
            href="/collections/best-sellers"
            className="inline-flex h-11 items-center justify-center border border-sa-border px-8 text-[12px] font-semibold uppercase tracking-[0.1em] text-sa-primary transition-colors hover:border-terra hover:text-terra"
          >
            Shop Best Sellers
          </Link>
        </div>

        {/* Quick links */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          {[
            { label: "New Launches", href: "/collections/new-launches" },
            { label: "Perfumes", href: "/collections/perfumes" },
            { label: "Perfume Oils", href: "/collections/perfume-oil" },
            { label: "Gift Sets", href: "/collections/giftsets-gifts" },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[12px] font-semibold uppercase tracking-[0.1em] text-sa-muted transition-colors hover:text-terra"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </StorefrontShell>
  );
}
