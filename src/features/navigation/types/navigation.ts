export type NavItemType =
  | "COLLECTION"
  | "CATEGORY"
  | "PRODUCT"
  | "URL"
  | "GROUP_HEADER";

export type NavItem = {
  id: string;
  label: string;
  slug: string | null;
  type: NavItemType;
  href: string | null;
  /** Picture of the linked collection (tiles such as "Shop by categories"). */
  image?: string | null;
  children?: NavItem[];
};

export type NavigationMetadata = {
  generatedAt: string;
  source: "bound_menu" | "catalog_categories";
  cmsAvailable: boolean;
  headerMenuHandle?: string | null;
  footerMenuHandle?: string | null;
  /** The market's "Shop by" menu (Sapil's chip row); absent on older backends. */
  shopByMenuHandle?: string | null;
  note?: string;
};

export type NavigationPayload = {
  context: {
    zoneId: string;
    zoneCode: string;
    [key: string]: unknown;
  };
  header: NavItem[];
  footer: NavItem[];
  /** "Shop by" menu, same item shape as `header`. Empty when the market has none;
   *  older backends omit it, which means the same. */
  shopBy?: NavItem[];
  metadata: NavigationMetadata;
};
