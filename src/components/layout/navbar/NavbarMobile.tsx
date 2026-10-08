"use client";

import { Fragment } from "react";
import { LocaleLink } from "@/lib/i18n/LocaleLink";
import { PRIMARY_NAV, type ChromeNavItem } from "@/features/home/constants/chromeNav";
import { mobileNav, mobileNavLink, mobileNavList, mobileNavSub, mobileNavSubLabel } from "@/styles/siteChrome";
import { CaretIcon } from "./NavbarIcons";
import type { NavbarChrome } from "./useNavbarChrome";

export function NavbarMobile({
  chrome,
  items = PRIMARY_NAV,
}: {
  chrome: NavbarChrome;
  items?: readonly ChromeNavItem[];
}) {
  return (
    <div className={mobileNav} id="mobile-nav" hidden={!chrome.mobileOpen}>
      <ul className={mobileNavList} role="list">
        {items.map((item) => {
          if (item.type === "link") {
            return (
              <li key={item.label}>
                <LocaleLink
                  className={mobileNavLink}
                  href={item.href}
                  onClick={() => chrome.setMobileOpen(false)}
                >
                  {item.label}
                </LocaleLink>
              </li>
            );
          }

          const expanded = chrome.mobileGroup === item.id;
          return (
            <li key={item.id}>
              <button
                className={mobileNavLink}
                type="button"
                aria-expanded={expanded}
                aria-controls={`msub-${item.id}`}
                onClick={() => chrome.setMobileGroup(expanded ? null : item.id)}
              >
                <span>{item.label}</span>
                <CaretIcon />
              </button>
              <ul
                className={mobileNavSub}
                id={`msub-${item.id}`}
                role="list"
                hidden={!expanded}
              >
                <li>
                  <LocaleLink href={item.href} onClick={() => chrome.setMobileOpen(false)}>
                    All {item.label.toLowerCase()}
                  </LocaleLink>
                </li>
                {item.groups.map((group) => (
                  <Fragment key={group.heading}>
                    <li className={mobileNavSubLabel}>{group.heading}</li>
                    {group.links.map((link) => (
                      <li key={link.label}>
                        <LocaleLink href={link.href} onClick={() => chrome.setMobileOpen(false)}>
                          {link.label}
                        </LocaleLink>
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
