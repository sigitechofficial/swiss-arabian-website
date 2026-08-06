import { trendingProducts } from "@/features/home/data/homeContent";
import { Stagger, StaggerItem } from "@/components/motion";
import { ProductCard } from "./ProductCard";
import { Accent, SectionHeader } from "./SectionHeader";

export function TrendingSection() {
  return (
    <section
      className="mx-auto max-w-[1280px] px-4 py-16 sm:px-6 lg:px-10"
      aria-label="Trending now"
    >
      <SectionHeader
        eyebrow="Moving Fast"
        title={
          <>
            Trending <Accent>now</Accent>
          </>
        }
        href="/products"
        linkLabel="View all 32"
      />
      <Stagger className="-mx-4 grid grid-cols-2 gap-[6px] sm:-mx-6 md:mx-0 md:grid-cols-3 md:gap-4 xl:grid-cols-4">
        {trendingProducts.map((product) => (
          <StaggerItem key={product.id}>
            <ProductCard product={product} />
          </StaggerItem>
        ))}
      </Stagger>
    </section>
  );
}
