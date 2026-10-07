"use client";

import { LocaleLink } from "@/lib/i18n/LocaleLink";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { PRIMARY_NAV, type ChromeNavItem } from "@/features/home/constants/chromeNav";
import { mega, megaCols, megaHeading, megaInner, megaList, primaryNav, primaryNavCaret, primaryNavItem, primaryNavLink, primaryNavLinkAccent, primaryNavList, visuallyHidden } from "@/styles/siteChrome";
import { MegaShowcase } from "../MegaShowcase";
import { CaretIcon } from "./NavbarIcons";
import type { NavbarChrome } from "./useNavbarChrome";

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

export function NavbarPrimary({
  chrome,
  items = PRIMARY_NAV,
}: {
  chrome: NavbarChrome;
  items?: readonly ChromeNavItem[];
}) {
  return (
    <nav className={primaryNav} data-primary-nav aria-label="Primary" onMouseLeave={() => chrome.setOpenMega(null)}>
      <ul className={primaryNavList} data-primary-list role="list">
        {items.map((item) => {
          if (item.type === "link") {
            return (
              <li key={item.label} onMouseEnter={() => chrome.setOpenMega(null)}>
                <LocaleLink
                  className={item.accent ? `${primaryNavLink} ${primaryNavLinkAccent}` : primaryNavLink}
                  data-primary-link
                  href={item.href}
                >
                  {item.label}
                </LocaleLink>
              </li>
            );
          }

          const isOpen = chrome.openMega === item.id;
          return (
            <li
              key={item.id}
              className={primaryNavItem}
              data-primary-item
              data-open={isOpen ? "" : undefined}
              onMouseEnter={() => chrome.setOpenMega(item.id)}
            >
              <LocaleLink
                className={primaryNavLink}
                data-primary-link
                href={item.href}
                onClick={() => chrome.setOpenMega(null)}
              >
                {item.label}
              </LocaleLink>
              <button
                className={primaryNavCaret}
                data-primary-caret
                type="button"
                aria-expanded={isOpen}
                aria-controls={`mega-${item.id}`}
                onClick={() => chrome.setOpenMega(isOpen ? null : item.id)}
              >
                <CaretIcon />
                <span className={visuallyHidden}>{item.label} submenu</span>
              </button>
              <AnimatePresence>
                {isOpen ? (
                  <motion.div
                    className={mega}
                    id={`mega-${item.id}`}
                    variants={megaPanelVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    onClick={(event) => {
                      if ((event.target as HTMLElement).closest("a")) {
                        chrome.setOpenMega(null);
                      }
                    }}
                  >
                    <div className={megaInner}>
                      <div className={megaCols}>
                        {item.groups.map((group) => (
                          <motion.div key={group.heading} variants={megaItemVariants}>
                            <p className={megaHeading}>{group.heading}</p>
                            <ul className={megaList} role="list">
                              {group.links.map((link) => (
                                <li key={link.label}>
                                  <LocaleLink href={link.href}>{link.label}</LocaleLink>
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
