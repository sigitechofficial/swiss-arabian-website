"use client";

import type { ReactNode } from "react";
import { ProductRail } from "../components/home/ProductRail";
import { CollectionsStory } from "../components/home/CollectionsStory";
import { HeroGallery } from "../components/home/HeroGallery";
import { HomeBundles } from "../components/home/HomeBundles";
import { parseBundle, parseHeroGallery, homeProducts } from "../components/home/cmsSections";
import { FIXTURE_HOME_SECTIONS, FIXTURE_PRODUCTS } from "../components/home/fixtures";
import { SapilAnnouncement } from "../components/shell/SapilAnnouncement";
import { SapilFooterView } from "../components/shell/SapilFooter";
import { SapilHeader } from "../components/shell/SapilHeader";
import { SapilShopBy } from "../components/shell/SapilShopBy";
import type { MenuItem, ShopByChip } from "../components/shell/shellData";

/* v9 mock values (sapil-v9-note-by-note.html as rendered), for the visual diff only. */
const LOGO = { src: "https://sapil.com/cdn/shop/files/sapil-logo123.png?v=1709725825&width=300", alt: "Sapil", width: 300, height: 129 };
const item = (label: string, dropdown = false): MenuItem => ({
  id: label,
  label,
  href: dropdown ? null : `#${label}`,
  options: dropdown ? [{ id: `${label}-o`, label: "Option", href: "#o" }] : [],
  columns: [],
});
const MENU: MenuItem[] = [
  item("Home"),
  item("New Arrival"),
  item("Collections", true),
  item("Shop by Mood", true),
  item("Seasons & Moments", true),
  item("All Perfume", true),
  item("Halloween", true),
  item("Blogs"),
];
const CHIPS: ShopByChip[] = [
  { id: "her", label: "For Her", href: "#her", color: "peach" },
  { id: "him", label: "For Him", href: "#him", color: "sky" },
  { id: "uni", label: "Unisex", href: "#uni", color: "lilac" },
  { id: "mood", label: "Mood", href: "#mood", color: "butter" },
  { id: "note", label: "Note", href: "#note", color: "mint" },
  { id: "bundles", label: "Bundles", href: "#bundles", color: "sage" },
  { id: "gift", label: "Gift sets", href: "#gift", color: "sand" },
];
const FOOTER = [
  { id: "shop", heading: "Shop", links: ["New arrivals", "Best sellers", "Under AED 99", "Bundles & gifts"].map((label) => ({ label, href: "#" })) },
  { id: "discover", heading: "Discover", links: ["Shop by note", "Shop by mood", "Collections", "Blogs", "About Sapil"].map((label) => ({ label, href: "#" })) },
  { id: "help", heading: "Help", links: ["Track your order", "Delivery", "Returns", "Contact"].map((label) => ({ label, href: "#" })) },
];

function Piece({ id, only, children }: { id: string; only?: string; children: ReactNode }) {
  if (only && only !== id) return null;
  return <div data-kit={id}>{children}</div>;
}

/** Dev-only: the Sapil chrome and static home parts with v9's mock values (scripts/sapil-visual-diff.mjs). */
export function SapilShellPreview({ only, lead }: { only?: string; lead?: string }) {
  const heroData = { ...FIXTURE_HOME_SECTIONS[0].data, lead: lead ?? FIXTURE_HOME_SECTIONS[0].data.lead };
  const hero = parseHeroGallery(heroData);
  const products = homeProducts(FIXTURE_PRODUCTS);
  const bundle = parseBundle("b", { products: FIXTURE_PRODUCTS.slice(0, 4), heading: "The Fruity Four" });
  return (
    <>
      <Piece id="shell-announce" only={only}>
        <SapilAnnouncement items={[{ message: "New: The Scent Society · Four expressions, one signature →", link: { type: "INTERNAL_PATH", url: "/collections/x" } }]} />
      </Piece>
      <Piece id="shell-header" only={only}>
        <SapilHeader logo={LOGO} menu={MENU} pathname="/" bagCount={0} accountHref="#" onOpenMenu={() => {}} onOpenSearch={() => {}} onOpenBag={() => {}} />
      </Piece>
      <Piece id="shell-subnav" only={only}>
        <SapilShopBy chips={CHIPS} pathname="/" currency="AED" priceEditTiers={[50, 99, 199]} freeDeliveryThreshold={100} cashOnDelivery />
      </Piece>
      <Piece id="hero-intro" only={only}>
        {hero ? <HeroGallery hero={hero} /> : null}
      </Piece>
      <Piece id="sechead-new" only={only}>
        <ProductRail sectionId="new-preview" band eyebrow="New arrivals" title="Just landed," accent="still fizzing." description="The Scent Society, Solid Legacy and Chichi Fantasy, plus Sarab, Zeyn and Alchemy." products={products} />
      </Piece>
      <Piece id="sechead-collections" only={only}>
        <CollectionsStory heading={null} text={null} cards={[]} />
      </Piece>
      <Piece id="sechead-best" only={only}>
        <ProductRail sectionId="best-preview" eyebrow="Top sellers" title="The ones that" accent="keep selling out." products={products} viewAll={{ label: "Shop all best sellers", href: "#" }} />
      </Piece>
      <Piece id="sechead-bundles" only={only}>
        {bundle ? <HomeBundles bundles={[{ ...bundle, description: "Hand-picked sets, one tap to add. The saving comes off in your bag automatically." }]} /> : null}
      </Piece>
      <Piece id="shell-footer" only={only}>
        <SapilFooterView logo={LOGO} columns={FOOTER} copyright="© 2026 Sapil" />
      </Piece>
    </>
  );
}
