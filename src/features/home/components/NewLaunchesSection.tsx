import { newLaunches } from "@/features/home/data/homeContent";
import { Stagger, StaggerItem } from "@/components/motion";
import { ProductCard } from "./ProductCard";
import { Accent, SectionHeader } from "./SectionHeader";

export function NewLaunchesSection() {
  return (
    <section
      id="new-launches"
      className="mx-auto max-w-[1280px] px-4 py-16 sm:px-6 lg:px-10"
      aria-label="New launches"
    >
      <SectionHeader
        eyebrow="Just Arrived"
        title={
          <>
            New <Accent>Launches</Accent>
          </>
        }
        href="/products"
        linkLabel="View all 24"
      />
      <Stagger className="-mx-4 grid grid-cols-2 gap-[6px] sm:-mx-6 md:mx-0 md:grid-cols-3 md:gap-4 xl:grid-cols-4">
        {newLaunches.map((product) => (
          <StaggerItem key={product.id}>
            <ProductCard product={product} />
          </StaggerItem>
        ))}
      </Stagger>
    </section>
  );
}
