"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import {
  MOBILE_NAV,
  type MobileNavGroup,
  type MobileNavItem,
  type MobileNavLink,
} from "@/features/home/constants/homeAssets";
import { easeOutExpo } from "@/lib/motion/variants";

type NavColumn = {
  heading?: string;
  links: MobileNavLink[];
};

function groupToColumns(children: MobileNavGroup["children"]): NavColumn[] {
  const columns: NavColumn[] = [];
  let current: NavColumn = { links: [] };

  for (const child of children) {
    if ("kind" in child && child.kind === "heading") {
      if (current.heading || current.links.length > 0) {
        columns.push(current);
      }
      current = { heading: child.label, links: [] };
      continue;
    }
    if ("href" in child) {
      current.links.push(child);
    }
  }

  if (current.heading || current.links.length > 0) {
    columns.push(current);
  }

  return columns.length > 0 ? columns : [{ links: [] }];
}

const CLOSE_DELAY_MS = 140;

function DesktopNavDropdown({ item }: { item: MobileNavGroup }) {
  const columns = groupToColumns(item.children);
  const multiColumn = columns.some((c) => c.heading) && columns.length > 1;
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function clearCloseTimer() {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }

  function openMenu() {
    clearCloseTimer();
    setOpen(true);
  }

  function scheduleClose() {
    clearCloseTimer();
    closeTimer.current = setTimeout(() => setOpen(false), CLOSE_DELAY_MS);
  }

  useEffect(() => () => clearCloseTimer(), []);

  const triggerClass =
    "inline-flex items-center gap-1.5 opacity-70 transition-opacity hover:opacity-100 focus-visible:opacity-100";

  const chevron = (
    <motion.span
      className="text-[10px] text-sa-muted"
      aria-hidden
      animate={{ rotate: open ? 180 : 0 }}
      transition={
        reduceMotion
          ? { duration: 0 }
          : { duration: 0.28, ease: easeOutExpo }
      }
    >
      ▾
    </motion.span>
  );

  return (
    <li
      className="relative"
      onMouseEnter={openMenu}
      onMouseLeave={scheduleClose}
      onFocus={openMenu}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          scheduleClose();
        }
      }}
    >
      {item.href ? (
        <Link
          href={item.href}
          className={triggerClass}
          aria-expanded={open}
          aria-haspopup="true"
        >
          {item.label}
          {chevron}
        </Link>
      ) : (
        <button
          type="button"
          className={triggerClass}
          aria-expanded={open}
          aria-haspopup="true"
          onClick={() => setOpen((value) => !value)}
        >
          {item.label}
          {chevron}
        </button>
      )}

      <AnimatePresence>
        {open ? (
          <motion.div
            key={`${item.label}-menu`}
            role="region"
            aria-label={`${item.label} submenu`}
            className="absolute left-1/2 top-full z-50 pt-3"
            initial={
              reduceMotion
                ? { opacity: 1, x: "-50%", y: 0, scale: 1 }
                : { opacity: 0, x: "-50%", y: -10, scale: 0.98 }
            }
            animate={{ opacity: 1, x: "-50%", y: 0, scale: 1 }}
            exit={
              reduceMotion
                ? { opacity: 0, x: "-50%" }
                : { opacity: 0, x: "-50%", y: -6, scale: 0.98 }
            }
            transition={
              reduceMotion
                ? { duration: 0 }
                : {
                    duration: 0.32,
                    ease: easeOutExpo,
                  }
            }
          >
            <div
              className={`origin-top border border-sa-border bg-page shadow-[0_12px_28px_rgba(44,36,29,0.08)] dark:shadow-none ${
                multiColumn ? "min-w-[420px] p-6" : "min-w-[220px] px-5 py-4"
              }`}
            >
              <motion.div
                className={
                  multiColumn
                    ? "grid grid-cols-2 gap-8"
                    : "flex flex-col gap-1"
                }
                initial="hidden"
                animate="show"
                variants={{
                  hidden: {},
                  show: {
                    transition: reduceMotion
                      ? { staggerChildren: 0 }
                      : { staggerChildren: 0.035, delayChildren: 0.04 },
                  },
                }}
              >
                {columns.map((column, index) => (
                  <div
                    key={column.heading ?? `col-${index}`}
                    className="flex flex-col gap-1"
                  >
                    {column.heading ? (
                      <motion.p
                        variants={{
                          hidden: { opacity: 0, y: 6 },
                          show: {
                            opacity: 1,
                            y: 0,
                            transition: {
                              duration: 0.28,
                              ease: easeOutExpo,
                            },
                          },
                        }}
                        className="mb-2 text-[10.5px] font-bold uppercase tracking-[0.14em] text-gold"
                      >
                        {column.heading}
                      </motion.p>
                    ) : null}
                    <ul className="flex flex-col gap-0.5 text-[13px] font-medium normal-case tracking-normal">
                      {column.links.map((link) => (
                        <motion.li
                          key={link.label}
                          variants={{
                            hidden: { opacity: 0, y: 8 },
                            show: {
                              opacity: 1,
                              y: 0,
                              transition: {
                                duration: 0.3,
                                ease: easeOutExpo,
                              },
                            },
                          }}
                        >
                          <Link
                            href={link.href}
                            className="block py-1.5 text-sa-muted transition-colors hover:text-sa-primary"
                          >
                            {link.label}
                          </Link>
                        </motion.li>
                      ))}
                    </ul>
                  </div>
                ))}
              </motion.div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </li>
  );
}

function DesktopNavItem({ item }: { item: MobileNavItem }) {
  if (item.type === "link") {
    return (
      <li>
        <Link
          href={item.href}
          className="opacity-70 transition-opacity hover:opacity-100"
        >
          {item.label}
        </Link>
      </li>
    );
  }
  return <DesktopNavDropdown item={item} />;
}

type DesktopNavProps = {
  /** API-sourced nav items. Falls back to hardcoded MOBILE_NAV when not provided. */
  items?: MobileNavItem[];
};

/** Desktop main nav with hover/focus dropdowns — same hierarchy as mobile sheet. */
export function DesktopNav({ items }: DesktopNavProps) {
  const navItems = items?.length ? items : MOBILE_NAV;

  return (
    <nav
      aria-label="Main"
      className="hidden border-t border-sa-border lg:block"
    >
      <ul className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-center gap-x-7 gap-y-1 px-4 py-3.5 text-[13px] font-semibold uppercase tracking-wide sm:px-6 lg:px-10">
        {navItems.map((item) => (
          <DesktopNavItem key={item.label} item={item} />
        ))}
      </ul>
    </nav>
  );
}
