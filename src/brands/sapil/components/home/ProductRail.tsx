"use client";

import { useId, type ReactNode } from "react";
import { useSapilCopy } from "../../i18n/SapilCopy";
import { Button, SectionHead, Wrap } from "../../ui";
import { SapilLink } from "../shared/SapilLink";
import type { HomeProduct } from "./cmsSections";
import { HomeProductTile } from "./HomeProductTile";
import { HomeSection } from "./HomeParts";
import { RailControls, useRail } from "./useRail";

export type ProductRailProps = {
  sectionId: string;
  band?: boolean;
  eyebrow: ReactNode;
  title: ReactNode;
  accent?: ReactNode;
  description?: ReactNode;
  products: HomeProduct[];
  /** "Shop all …" link beside the arrows (top sellers) */
  viewAll?: { label: string; href: string } | null;
};

/** v9 product rail (#new, #bestsellers): section head, arrows, four cards per view (3 ≤1100, 2 ≤900). */
export function ProductRail({ sectionId, band, eyebrow, title, accent, description, products, viewAll }: ProductRailProps) {
  const t = useSapilCopy();
  const headingId = useId();
  const { railRef, ...rail } = useRail<HTMLDivElement>(24);
  const controls = <RailControls atStart={rail.atStart} atEnd={rail.atEnd} prev={rail.prev} next={rail.next} />;
  return (
    <HomeSection id={sectionId} band={band} labelledBy={headingId}>
      <Wrap>
        <SectionHead
          id={headingId}
          eyebrow={eyebrow}
          title={title}
          accent={accent}
          description={description}
          actions={
            viewAll ? (
              <div className="flex gap-[24px] items-center">
                <Button variant="link" href={viewAll.href} LinkComponent={SapilLink}>
                  {viewAll.label}
                </Button>
                {controls}
              </div>
            ) : (
              controls
            )
          }
        />
        <div
          ref={railRef}
          role="list"
          aria-label={t("home.railLabel")}
          className="grid grid-flow-col auto-cols-[calc((100%-72px)/4)] gap-[24px] overflow-x-auto snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-[4px] max-1100:auto-cols-[calc((100%-48px)/3)] max-900:auto-cols-[calc(50%-8px)] max-900:gap-[16px]"
        >
          {products.map(({ product, tileColor, wasPrice }) => (
            <div role="listitem" key={product.id} className="snap-start">
              <HomeProductTile product={product} tileColor={tileColor} wasPrice={wasPrice} />
            </div>
          ))}
        </div>
      </Wrap>
    </HomeSection>
  );
}
