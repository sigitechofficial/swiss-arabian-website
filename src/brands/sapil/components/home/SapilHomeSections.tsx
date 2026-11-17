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
import { sectionTitleProps } from "./HomeParts";
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
      return <HeroVideo heading={block.heading} title={block.title} subtitle={block.subtitle} />;
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
          {...sectionTitleProps(block.rail.title, t("home.newTitle"), t("home.newAccent"))}
          description={block.rail.subtitle ?? undefined}
          products={block.rail.products}
          viewAll={block.rail.viewAll}
        />
      );
    case "priceEdit":
      return <PriceEditShelf copy={block.copy} />;
    case "collections":
      return <CollectionsStory {...block.showcase} />;
    case "topSellers":
      return (
        <ProductRail
          sectionId="bestsellers"
          eyebrow={block.rail.heading ?? t("home.bestEyebrow")}
          {...sectionTitleProps(block.rail.title, t("home.bestTitle"), t("home.bestAccent"))}
          description={block.rail.subtitle ?? undefined}
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
      return <NotesRail heading={block.heading} title={block.title} subtitle={block.subtitle} />;
    case "bundles":
      return <HomeBundles bundles={block.bundles} />;
    case "reels":
      return <HomeReels heading={block.heading} title={block.title} subtitle={block.subtitle} />;
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
