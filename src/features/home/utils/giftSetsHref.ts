/**
 * The market's gift sets collection, from its menu (UAE `giftsets-gifts`,
 * Qatar `gifting-collection`): markets name it differently, so a fixed
 * address would be a broken link. All collections until the menu is loaded.
 */
export function giftSetsHref(links: ReadonlyArray<{ href: string }>): string {
  return (
    links.find((link) => /^\/collections\/gift/i.test(link.href))?.href ??
    "/collections"
  );
}
