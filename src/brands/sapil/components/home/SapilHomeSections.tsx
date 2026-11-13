"use client";

import { useMemo } from "react";
import type { CmsSection } from "@/features/cms/types/cmsHome.types";
import { buildLinkContextFromSections } from "@/features/cms/utils/buildLinkContext";
import { useSapilCopy } from "../../i18n/SapilCopy";
import { AboutBlock, HomeNewsletter } from "./AboutBlock";
import { planHome, type HomeBlock } from "./cmsSections";
import { CollectionsStory } from "./CollectionsStory";
import { HeroCampaign } from "./HeroCampaign";
import { HeroGallery } from "./HeroGallery";
import { HeroPromo, HomeBundles } from "./HomeBundles";
import { HeroVideo, HomeReels } from "./HomeVideo";
import { MoodWheel } from "./MoodWheel";
import { NotesRail } from "./NotesRail";
import { PriceEditShelf } from "./PriceEditShelf";
import { ProductRail } from "./ProductRail";

function Block({ block }: { block: HomeBlock }) {
  const t = useSapilCopy();
  switch (block.kind) {
    case "heroGallery":
      return <HeroGallery hero={block.hero} />;
    case "heroVideo":
      return <HeroVideo heading={block.heading} />;
    case "heroCampaign":
      return <HeroCampaign hero={block.hero} />;
    case "heroPromo":
      return <HeroPromo bundle={block.bundle} />;
    case "newArrivals":
      return (
        <ProductRail
          sectionId="new"
          band
          eyebrow={block.rail.heading ?? t("home.newEyebrow")}
          title={t("home.newTitle")}
          accent={t("home.newAccent")}
          products={block.rail.products}
          viewAll={block.rail.viewAll}
        />
      );
    case "priceEdit":
      return <PriceEditShelf />;
    case "collections":
      return <CollectionsStory {...block.showcase} />;
    case "topSellers":
      return (
        <ProductRail
          sectionId="bestsellers"
          eyebrow={block.rail.heading ?? t("home.bestEyebrow")}
          title={t("home.bestTitle")}
          accent={t("home.bestAccent")}
          products={block.rail.products}
          viewAll={{
            label: block.rail.viewAll?.label ?? t("home.bestShopAll"),
            href: block.rail.viewAllHref ?? "/products?sort=bestselling",
          }}
        />
      );
    case "mood":
      return <MoodWheel {...block.picker} />;
    case "notes":
      return <NotesRail heading={block.heading} />;
    case "bundles":
      return <HomeBundles bundles={block.bundles} />;
    case "reels":
      return <HomeReels heading={block.heading} />;
    case "about":
      return <AboutBlock story={block.story} />;
    case "newsletter":
      return <HomeNewsletter newsletter={block.newsletter} />;
    default:
      return null;
  }
}

/** Every v9 home section, from the published CMS homepage, in its order. */
export function SapilHomeSections({ sections }: { sections: CmsSection[] }) {
  const blocks = useMemo(() => planHome(sections, buildLinkContextFromSections(sections)), [sections]);
  return (
    <>
      {blocks.map((block) => (
        <Block key={block.id} block={block} />
      ))}
    </>
  );
}
