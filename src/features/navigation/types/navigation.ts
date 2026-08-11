/** API types for the navigation module — mirrors /storefront/navigation response. */

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
  /** null for GROUP_HEADER items */
  href: string | null;
  children?: NavItem[];
};

export type NavigationMetadata = {
  generatedAt: string;
  source: "bound_menu" | "catalog_categories";
  cmsAvailable: boolean;
  headerMenuHandle?: string | null;
  footerMenuHandle?: string | null;
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
  metadata: NavigationMetadata;
};
