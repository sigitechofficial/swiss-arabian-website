"use client";

import { Fragment } from "react";
import Link from "next/link";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { PRIMARY_NAV, TOPBAR_CURRENCIES, TOPBAR_LANGUAGES, TOPBAR_REGIONS, type ChromeNavItem } from "@/features/home/constants/chromeNav";
import { MegaShowcase } from "../MegaShowcase";
import { TopbarMenu } from "../TopbarMenu";
import { TopbarTicker } from "../TopbarTicker";
import { brandWordmarkFont } from "./brandWordmarkFont";
import { NavbarSearchDropdown } from "./NavbarSearchDropdown";
import type { NavbarVariant } from "./types";
import { useNavbarChrome, type NavbarChrome } from "./useNavbarChrome";

const megaPanelVariants: Variants = {
  hidden: { opacity: 0, scaleY: 0.96 },
  visible: {
    opacity: 1,
    scaleY: 1,
    transition: { duration: 0.22, ease: [0.4, 0, 0.2, 1] },
  },
  exit: {
    opacity: 0,
    scaleY: 0.96,
    transition: { duration: 0.16, ease: [0.4, 0, 1, 1] },
  },
};

const megaItemVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.18, ease: "easeOut" } },
};

function CaretIcon() {
  return (
    <svg
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      aria-hidden="true"
    >
      <path d="M2.5 4.5 6 8l3.5-3.5" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function AccountIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5.5 19.2c.8-3 3.3-4.7 6.5-4.7s5.7 1.7 6.5 4.7" />
    </svg>
  );
}

function BagIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6.5 8.5h11l-.85 11.2H7.35L6.5 8.5Z" />
      <path d="M9.2 8.5a2.8 2.8 0 0 1 5.6 0" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 19.4s-6.4-3.9-8.5-7.4C2.2 9.6 3.4 6.8 6.3 6.8c1.6 0 2.8.9 3.5 2.1.7-1.2 1.9-2.1 3.5-2.1 2.9 0 4.1 2.8 2.8 5.2-2.1 3.5-8.1 7.4-8.1 7.4Z" />
    </svg>
  );
}

function NavbarTopbar({
  chrome,
  hideUtils = false,
  boutique = false,
}: {
  chrome: NavbarChrome;
  hideUtils?: boolean;
  boutique?: boolean;
}) {
  const regionOptions = boutique
    ? TOPBAR_REGIONS.map(({ id, label }) => ({ id, label }))
    : TOPBAR_REGIONS;
  const languageOptions = boutique
    ? TOPBAR_LANGUAGES.map((option) => ({
        ...option,
        label: option.id.toUpperCase(),
      }))
    : TOPBAR_LANGUAGES;

  return (
    <div className={boutique ? "topbar topbar--boutique" : "topbar"}>
      <div className="container topbar__inner">
        {hideUtils ? null : <span className="topbar__spacer" aria-hidden="true" />}
        <TopbarTicker controls={boutique} />
        {hideUtils ? null : (
          <div className="topbar__utils">
            <TopbarMenu
              label="Ship to"
              value={chrome.regionId}
              options={regionOptions}
              open={chrome.openUtil === "region"}
              onOpenChange={(open) => chrome.setOpenUtil(open ? "region" : null)}
              onChange={chrome.setMarketId}
            />
            <span className="topbar__sep" aria-hidden="true" />
            {boutique ? (
              <>
                <TopbarMenu
                  label="Currency"
                  value={chrome.currencyId}
                  options={TOPBAR_CURRENCIES}
                  open={chrome.openUtil === "currency"}
                  onOpenChange={(open) => chrome.setOpenUtil(open ? "currency" : null)}
                  onChange={(id) =>
                    chrome.setCurrencyId(id as (typeof TOPBAR_CURRENCIES)[number]["id"])
                  }
                />
                <span className="topbar__sep" aria-hidden="true" />
              </>
            ) : null}
            <TopbarMenu
              label="Language"
              value={chrome.languageId}
              options={languageOptions}
              open={chrome.openUtil === "lang"}
              onOpenChange={(open) => chrome.setOpenUtil(open ? "lang" : null)}
              onChange={(id) =>
                chrome.setLanguageId(id as (typeof TOPBAR_LANGUAGES)[number]["id"])
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}

function NavbarBrand({ crop = false, wordmark = false }: { crop?: boolean; wordmark?: boolean }) {
  if (wordmark) {
    return (
      <Link
        className={`brand-link brand-link--wordmark ${brandWordmarkFont.className}`}
        href="/"
        aria-label="Swiss Arabian home"
      >
        Swiss{"\u00A0"}Arabian
      </Link>
    );
  }

  return (
    <Link
      className={crop ? "brand-link brand-link--crop" : "brand-link"}
      href="/"
      aria-label="Swiss Arabian home"
    >
      <img src="/assets/sa-logo-clear.png" alt="Swiss Arabian" />
    </Link>
  );
}

function NavbarStart({ chrome }: { chrome: NavbarChrome }) {
  return (
    <div className="nav-start">
      <button
        className="nav-toggle"
        type="button"
        aria-label={chrome.mobileOpen ? "Close menu" : "Open menu"}
        aria-expanded={chrome.mobileOpen}
        aria-controls="mobile-nav"
        onClick={() => chrome.setMobileOpen((open) => !open)}
      >
        <span />
        <span />
        <span />
        <span className="visually-hidden">
          {chrome.mobileOpen ? "Close menu" : "Open menu"}
        </span>
      </button>
      <button
        className="icon-btn nav-start__search"
        type="button"
        aria-label="Search"
        aria-expanded={chrome.searchOpen}
        aria-controls="ai-search"
        onClick={() => chrome.setSearchOpen(true)}
      >
        <SearchIcon />
      </button>
    </div>
  );
}

function NavbarBoutiqueActions({ chrome }: { chrome: NavbarChrome }) {
  return (
    <div className="nav-actions nav-actions--boutique">
      <Link
        className="nav-tool"
        href={chrome.isAuthenticated ? "/account" : "/login"}
      >
        <AccountIcon />
        <span className="nav-tool__label">Account</span>
      </Link>
      <Link className="nav-tool" href="/account/wishlist">
        <HeartIcon />
        <span className="nav-tool__label">Wishlist</span>
      </Link>
      <span className="nav-tool-sep" aria-hidden="true" />
      <button
        className="nav-tool"
        type="button"
        aria-controls="cart-drawer"
        onClick={() => chrome.setCartOpen(true)}
      >
        <span className="nav-tool__icon">
          <BagIcon />
          <span className="bag-count" hidden={chrome.itemCount < 1} aria-hidden={chrome.itemCount < 1}>
            {chrome.itemCount}
          </span>
        </span>
        <span className="nav-tool__label">Cart</span>
      </button>
    </div>
  );
}

function NavbarActions({
  chrome,
  hideSearch = false,
}: {
  chrome: NavbarChrome;
  hideSearch?: boolean;
}) {
  return (
    <div className="nav-actions">
      <Link
        className="icon-btn nav-actions__account"
        href={chrome.isAuthenticated ? "/account" : "/login"}
        aria-label="Account"
      >
        <AccountIcon />
      </Link>
      <div className="nav-utils">
        {hideSearch ? null : (
          <button
            className="icon-btn nav-utils__search"
            type="button"
            aria-label="Search"
            aria-expanded={chrome.searchOpen}
            aria-controls="ai-search"
            onClick={() => chrome.setSearchOpen(true)}
          >
            <SearchIcon />
          </button>
        )}
        <button
          className="icon-btn"
          type="button"
          aria-label="Bag"
          aria-controls="cart-drawer"
          onClick={() => chrome.setCartOpen(true)}
        >
          <BagIcon />
          <span className="bag-count" hidden={chrome.itemCount < 1} aria-hidden={chrome.itemCount < 1}>
            {chrome.itemCount}
          </span>
          <span className="visually-hidden">Bag ({chrome.itemCount} items)</span>
        </button>
      </div>
    </div>
  );
}

function NavbarSearchField({ chrome }: { chrome: NavbarChrome }) {
  return (
    <button
      className="nav-search-field"
      type="button"
      aria-label="Search"
      aria-expanded={chrome.searchOpen}
      aria-controls="ai-search"
      onClick={() => chrome.setSearchOpen(true)}
    >
      <SearchIcon />
      <span>Search fragrances</span>
    </button>
  );
}

function NavbarPrimary({
  chrome,
  items = PRIMARY_NAV,
}: {
  chrome: NavbarChrome;
  items?: readonly ChromeNavItem[];
}) {
  return (
    <nav className="primary-nav" aria-label="Primary" onMouseLeave={() => chrome.setOpenMega(null)}>
      <ul className="primary-nav__list" role="list">
        {items.map((item) => {
          if (item.type === "link") {
            return (
              <li key={item.label}>
                <Link
                  className={
                    item.accent ? "primary-nav__link primary-nav__link--accent" : "primary-nav__link"
                  }
                  href={item.href}
                >
                  {item.label}
                </Link>
              </li>
            );
          }

          const isOpen = chrome.openMega === item.id;
          return (
            <li
              key={item.id}
              className={isOpen ? "primary-nav__item is-open" : "primary-nav__item"}
              onMouseEnter={() => chrome.setOpenMega(item.id)}
            >
              <Link className="primary-nav__link" href={item.href}>
                {item.label}
              </Link>
              <button
                className="primary-nav__caret"
                type="button"
                aria-expanded={isOpen}
                aria-controls={`mega-${item.id}`}
                onClick={() => chrome.setOpenMega(isOpen ? null : item.id)}
              >
                <CaretIcon />
                <span className="visually-hidden">{item.label} submenu</span>
              </button>
              <AnimatePresence>
                {isOpen ? (
                  <motion.div
                    className="mega"
                    id={`mega-${item.id}`}
                    variants={megaPanelVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    <div className="mega__inner">
                      <div className="mega__cols">
                        {item.groups.map((group) => (
                          <motion.div
                            className="mega__group"
                            key={group.heading}
                            variants={megaItemVariants}
                          >
                            <p className="mega__heading">{group.heading}</p>
                            <ul className="mega__list" role="list">
                              {group.links.map((link) => (
                                <li key={link.label}>
                                  <Link href={link.href}>{link.label}</Link>
                                </li>
                              ))}
                            </ul>
                          </motion.div>
                        ))}
                      </div>
                      <MegaShowcase item={item} itemVariants={megaItemVariants} />
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function NavbarMobile({
  chrome,
  items = PRIMARY_NAV,
}: {
  chrome: NavbarChrome;
  items?: readonly ChromeNavItem[];
}) {
  return (
    <div className="mobile-nav" id="mobile-nav" hidden={!chrome.mobileOpen}>
      <ul className="mobile-nav__list" role="list">
        {items.map((item) => {
          if (item.type === "link") {
            return (
              <li key={item.label}>
                <Link
                  className={item.accent ? "mobile-nav__link--accent" : undefined}
                  href={item.href}
                  onClick={() => chrome.setMobileOpen(false)}
                >
                  {item.label}
                </Link>
              </li>
            );
          }

          const expanded = chrome.mobileGroup === item.id;
          return (
            <li key={item.id}>
              <button
                className="mobile-nav__group-toggle"
                type="button"
                aria-expanded={expanded}
                aria-controls={`msub-${item.id}`}
                onClick={() => chrome.setMobileGroup(expanded ? null : item.id)}
              >
                <span>{item.label}</span>
                <CaretIcon />
              </button>
              <ul
                className="mobile-nav__sub"
                id={`msub-${item.id}`}
                role="list"
                hidden={!expanded}
              >
                <li>
                  <Link href={item.href} onClick={() => chrome.setMobileOpen(false)}>
                    All {item.label.toLowerCase()}
                  </Link>
                </li>
                {item.groups.map((group) => (
                  <Fragment key={group.heading}>
                    <li className="mobile-nav__sub-label">{group.heading}</li>
                    {group.links.map((link) => (
                      <li key={link.label}>
                        <Link href={link.href} onClick={() => chrome.setMobileOpen(false)}>
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </Fragment>
                ))}
              </ul>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function NavbarShell({
  chrome,
  variant,
  items = PRIMARY_NAV,
}: {
  chrome: NavbarChrome;
  variant: NavbarVariant;
  items?: readonly ChromeNavItem[];
}) {
  const showSplitSearch = variant === "split";
  const inlineNav = variant === "inline" || variant === "inline-locale";
  const logoLeftSearch = variant === "logo-center" || variant === "underline";

  return (
    <div className="container nav-shell">
      <NavbarStart chrome={chrome} />
      {logoLeftSearch ? (
        <>
          <NavbarSearchDropdown />
          <NavbarBrand crop={variant === "logo-center"} wordmark={variant === "underline"} />
          <NavbarActions chrome={chrome} hideSearch />
        </>
      ) : variant === "minimal" ? (
        <>
          <NavbarSearchDropdown placeholder="Search for fragrances, collections..." />
          <NavbarBrand />
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

const LP2_HIDDEN_MENUS = new Set(["Minis", "Landing pages"]);

const LP5_NAV: ChromeNavItem[] = [
  ...PRIMARY_NAV.map((item) =>
    item.type === "link" && item.label === "Gift Sets" ? { ...item, accent: false } : item,
  ),
  { type: "link", label: "Offers", href: "/collections/best-sellers", accent: true },
];

export function Navbar({ variant = "classic" }: { variant?: NavbarVariant }) {
  const chrome = useNavbarChrome();
  const boutique = variant === "minimal";
  const navInShell = variant === "inline" || variant === "inline-locale";
  const navItems =
    variant === "inline" || variant === "inline-locale"
      ? PRIMARY_NAV.filter((item) => !LP2_HIDDEN_MENUS.has(item.label))
      : boutique
        ? LP5_NAV
        : PRIMARY_NAV;

  return (
    <header className="site-header" data-navbar={variant} ref={chrome.headerRef}>
      <NavbarTopbar
        chrome={chrome}
        boutique={boutique}
        hideUtils={variant === "logo-center" || variant === "inline"}
      />
      <NavbarShell chrome={chrome} variant={variant} items={navItems} />
      {navInShell ? null : <NavbarPrimary chrome={chrome} items={navItems} />}
      <NavbarMobile chrome={chrome} items={navItems} />
    </header>
  );
}
