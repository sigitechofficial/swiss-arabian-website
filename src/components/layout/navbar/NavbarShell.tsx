"use client";

import { PRIMARY_NAV, type ChromeNavItem } from "@/features/home/constants/chromeNav";
import { useShopCopy } from "@/lib/i18n/useShopCopy";
import { navShell, navShellMinimal, pageContainer } from "@/styles/siteChrome";
import type { NavbarVariant } from "./types";
import type { NavbarChrome } from "./useNavbarChrome";
import { NavbarActions } from "./NavbarActions";
import { NavbarBoutiqueActions } from "./NavbarBoutiqueActions";
import { NavbarBrand } from "./NavbarBrand";
import { NavbarPrimary } from "./NavbarPrimary";
import { NavbarSearchDropdown } from "./NavbarSearchDropdown";
import { NavbarStart } from "./NavbarStart";

export function NavbarShell({
  chrome,
  variant,
  items = PRIMARY_NAV,
}: {
  chrome: NavbarChrome;
  variant: NavbarVariant;
  items?: readonly ChromeNavItem[];
}) {
  const copy = useShopCopy();
  const showSplitSearch = variant === "split";
  const inlineNav = variant === "inline" || variant === "inline-locale";
  const logoLeftSearch = variant === "logo-center" || variant === "underline";

  return (
    <div
      className={`${pageContainer} ${navShell} ${variant === "minimal" ? navShellMinimal : ""}`}
      data-nav-shell
    >
      <NavbarStart chrome={chrome} />
      {logoLeftSearch ? (
        <>
          <NavbarSearchDropdown />
          <NavbarBrand crop={variant === "logo-center"} wordmark={variant === "underline"} />
          <NavbarActions chrome={chrome} hideSearch />
        </>
      ) : variant === "minimal" ? (
        <>
          <NavbarSearchDropdown placeholder={copy("search")} />
          <NavbarBrand centered />
          <NavbarBoutiqueActions chrome={chrome} />
        </>
      ) : showSplitSearch ? (
        <>
          <NavbarBrand crop />
          <NavbarSearchDropdown />
          <NavbarActions chrome={chrome} hideSearch />
        </>
      ) : inlineNav ? (
        <>
          <NavbarBrand crop={variant === "inline-locale"} />
          <NavbarPrimary chrome={chrome} items={items} />
          <NavbarActions chrome={chrome} />
        </>
      ) : (
        <>
          <NavbarBrand />
          <NavbarActions chrome={chrome} />
        </>
      )}
    </div>
  );
}
