import Image from "next/image";
import { LocaleLink } from "@/lib/i18n/LocaleLink";

type CatalogEmptyStateProps = {
  title?: string;
  description?: string;
};

export function CatalogEmptyState({
  title = "No products found",
  description = "We couldn’t find fragrances for this market right now. Check back soon or browse the home page.",
}: CatalogEmptyStateProps) {
  return (
    <div
      className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center"
      role="status"
    >
      <Image
        src="/assets/catalog/empty-products.svg"
        alt=""
        width={200}
        height={200}
        className="mb-6 opacity-90"
        unoptimized
      />
      <h2 className="font-sans text-[22px] font-medium tracking-[-0.01em] text-sa-primary">
        {title}
      </h2>
      <p className="mt-2 max-w-sm text-[14px] leading-relaxed text-sa-muted">
        {description}
      </p>
      <LocaleLink
        href="/"
        className="mt-6 inline-flex h-[42px] cursor-pointer items-center justify-center bg-terra px-8 text-[12px] font-semibold uppercase tracking-[0.1em] text-white transition-colors hover:bg-[#a25e48]"
      >
        Back to home
      </LocaleLink>
    </div>
  );
}
