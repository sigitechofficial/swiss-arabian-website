"use client";

import { Fragment, useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { useAuthStore } from "@/stores/useAuthStore";
import { useCartStore } from "@/stores/useCartStore";
import { useUiStore } from "@/stores/useUiStore";
import { PRIMARY_NAV, TOPBAR_CATS } from "@/features/home/constants/chromeNav";
import { MegaShowcase } from "./MegaShowcase";

// Fast scaleY squeeze + fade, no vertical slide or stagger — matches the
// reference nav (swissdemo.sigisolutions.net): panel opens as if unfolding
// from the nav bar, not sliding down from above.
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

export function SiteHeader() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const persistedItemCount = useCartStore((s) => s.itemCount());
  // The cart is persisted to localStorage, which the server can't see — so
  // the very first client render must still report 0 (matching SSR) and
  // only pick up the real, rehydrated count once mounted. Otherwise React
  // sees a server/client attribute + text mismatch on `.bag-count` and
  // Next's dev overlay treats it as a fatal hydration error.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  const itemCount = mounted ? persistedItemCount : 0;
  const setCartOpen = useUiStore((s) => s.setCartOpen);
  const setSearchOpen = useUiStore((s) => s.setSearchOpen);
  const searchOpen = useUiStore((s) => s.searchOpen);
  const [openMega, setOpenMega] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileGroup, setMobileGroup] = useState<string | null>(null);
  const headerRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    const syncHeaderHeight = () => {
      const topbar = header.querySelector(".topbar");
      const shell = header.querySelector(".nav-shell");
      const nav = header.querySelector(".primary-nav");
      const navVisible =
        nav instanceof HTMLElement && getComputedStyle(nav).display !== "none";
      const height =
        (topbar?.getBoundingClientRect().height ?? 0) +
        (shell?.getBoundingClientRect().height ?? 0) +
        (navVisible ? nav.getBoundingClientRect().height : 0);
      document.documentElement.style.setProperty(
        "--site-header-h",
        `${Math.round(height)}px`,
      );
    };

    syncHeaderHeight();
    const observer = new ResizeObserver(syncHeaderHeight);
    observer.observe(header);
    window.addEventListener("resize", syncHeaderHeight);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", syncHeaderHeight);
    };
  }, []);

  return (
    <header className="site-header" ref={headerRef}>
      <div className="topbar">
        <div className="container topbar__inner">
          <nav className="topbar__cats" aria-label="Shop by category">
            {TOPBAR_CATS.map((cat) => (
              <Link key={cat.label} className="topbar__cat" href={cat.href}>
                {cat.label}
              </Link>
            ))}
          </nav>
          <div className="topbar__utils">
            <button className="topbar__region" type="button">
              <span className="topbar__flag" aria-hidden="true">
                🇦🇪
              </span>
              UAE <span className="topbar__change">Change</span>
            </button>
            <span className="topbar__sep" aria-hidden="true" />
            <button
              className="topbar__lang"
              type="button"
              lang="ar"
              disabled
              aria-disabled="true"
              tabIndex={-1}
            >
              العربية
            </button>
          </div>
        </div>
      </div>

      <div className="container nav-shell">
        <div className="nav-start">
          <button
            className="nav-toggle"
            type="button"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
            onClick={() => setMobileOpen((open) => !open)}
          >
            <span />
            <span />
            <span />
            <span className="visually-hidden">
              {mobileOpen ? "Close menu" : "Open menu"}
            </span>
          </button>
          {/* Tablet/mobile-only copy of the search button, rendered right next
              to the menu toggle — the desktop one further down (inside
              `.nav-utils`) hides at that breakpoint instead of duplicating
              visually. Same handler, so either one opens the same overlay. */}
          <button
            className="icon-btn nav-start__search"
            type="button"
            aria-label="Search"
            aria-expanded={searchOpen}
            aria-controls="ai-search"
            onClick={() => setSearchOpen(true)}
          >
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
          </button>
        </div>
        <Link className="brand-link" href="/" aria-label="Swiss Arabian home">
          <img src="/assets/sa-logo-clear.png" alt="Swiss Arabian" />
        </Link>
        <div className="nav-actions">
          <Link
            className="icon-btn nav-actions__account"
            href={isAuthenticated ? "/account" : "/login"}
            aria-label="Account"
          >
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
            >
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
            </svg>
          </Link>
          <div className="nav-utils">
            <button
              className="icon-btn nav-utils__search"
              type="button"
              aria-label="Search"
              aria-expanded={searchOpen}
              aria-controls="ai-search"
              onClick={() => setSearchOpen(true)}
            >
              <svg
                viewBox="0 0 24 24"
                width="20"
                height="20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
            </button>
            <button
              className="icon-btn"
              type="button"
              aria-label="Bag"
              aria-controls="cart-drawer"
              onClick={() => setCartOpen(true)}
            >
              <svg
                viewBox="0 0 24 24"
                width="20"
                height="20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
              >
                <path d="M6 8h12l-1 12H7L6 8Z" />
                <path d="M9 8a3 3 0 0 1 6 0" />
              </svg>
              <span
                className="bag-count"
                hidden={itemCount < 1}
                aria-hidden={itemCount < 1}
              >
                {itemCount}
              </span>
              <span className="visually-hidden">Bag ({itemCount} items)</span>
            </button>
          </div>
        </div>
      </div>

      <nav
        className="primary-nav"
        aria-label="Primary"
        onMouseLeave={() => setOpenMega(null)}
      >
        <ul className="primary-nav__list" role="list">
          {PRIMARY_NAV.map((item) => {
            if (item.type === "link") {
              return (
                <li key={item.label}>
                  <Link
                    className={
                      item.accent
                        ? "primary-nav__link primary-nav__link--accent"
                        : "primary-nav__link"
                    }
                    href={item.href}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            }

            const isOpen = openMega === item.id;
            return (
              <li
                key={item.id}
                className={isOpen ? "primary-nav__item is-open" : "primary-nav__item"}
                onMouseEnter={() => setOpenMega(item.id)}
              >
                <Link className="primary-nav__link" href={item.href}>
                  {item.label}
                </Link>
                <button
                  className="primary-nav__caret"
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={`mega-${item.id}`}
                  onClick={() => setOpenMega(isOpen ? null : item.id)}
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

      <div className="mobile-nav" id="mobile-nav" hidden={!mobileOpen}>
        <ul className="mobile-nav__list" role="list">
          {PRIMARY_NAV.map((item) => {
            if (item.type === "link") {
              return (
                <li key={item.label}>
                  <Link
                    className={item.accent ? "mobile-nav__link--accent" : undefined}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            }

            const expanded = mobileGroup === item.id;
            return (
              <li key={item.id}>
                <button
                  className="mobile-nav__group-toggle"
                  type="button"
                  aria-expanded={expanded}
                  aria-controls={`msub-${item.id}`}
                  onClick={() => setMobileGroup(expanded ? null : item.id)}
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
                    <Link href={item.href} onClick={() => setMobileOpen(false)}>
                      All {item.label.toLowerCase()}
                    </Link>
                  </li>
                  {item.groups.map((group) => (
                    <Fragment key={group.heading}>
                      <li className="mobile-nav__sub-label">{group.heading}</li>
                      {group.links.map((link) => (
                        <li key={link.label}>
                          <Link
                            href={link.href}
                            onClick={() => setMobileOpen(false)}
                          >
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
    </header>
  );
}
