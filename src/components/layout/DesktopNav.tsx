"use client";

import Link from "next/link";
import {
  MOBILE_NAV,
  type MobileNavGroup,
  type MobileNavItem,
  type MobileNavLink,
} from "@/features/home/constants/homeAssets";

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

function DesktopNavDropdown({ item }: { item: MobileNavGroup }) {
  const columns = groupToColumns(item.children);
  const multiColumn = columns.some((c) => c.heading) && columns.length > 1;

  return (
    <li className="group relative">
      <button
        type="button"
        className="inline-flex items-center gap-1.5 opacity-70 transition-opacity hover:opacity-100"
        aria-haspopup="true"
      >
        {item.label}
        <span
          className="text-[10px] text-sa-muted transition-transform group-hover:rotate-180 group-focus-within:rotate-180"
          aria-hidden
        >
          ▾
        </span>
      </button>

      <div
        role="region"
        aria-label={`${item.label} submenu`}
        className="invisible absolute left-1/2 top-full z-50 -translate-x-1/2 pt-3 opacity-0 transition-[opacity,visibility] pointer-events-none group-hover:visible group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:visible group-focus-within:opacity-100 group-focus-within:pointer-events-auto"
      >
        <div
          className={`border border-sa-border bg-page shadow-[0_12px_28px_rgba(44,36,29,0.08)] dark:shadow-none ${
            multiColumn ? "min-w-[420px] p-6" : "min-w-[220px] px-5 py-4"
          }`}
        >
          <div
            className={
              multiColumn ? "grid grid-cols-2 gap-8" : "flex flex-col gap-1"
            }
          >
            {columns.map((column, index) => (
              <div
                key={column.heading ?? `col-${index}`}
                className="flex flex-col gap-1"
              >
                {column.heading ? (
                  <p className="mb-2 text-[10.5px] font-bold uppercase tracking-[0.14em] text-gold">
                    {column.heading}
                  </p>
                ) : null}
                <ul className="flex flex-col gap-0.5 text-[13px] font-medium normal-case tracking-normal">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="block py-1.5 text-sa-muted transition-colors hover:text-sa-primary"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
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

/** Desktop main nav with hover/focus dropdowns — same hierarchy as mobile sheet. */
export function DesktopNav() {
  return (
    <nav
      aria-label="Main"
      className="hidden border-t border-sa-border lg:block"
    >
      <ul className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-center gap-x-7 gap-y-1 px-4 py-3.5 text-[13px] font-semibold uppercase tracking-wide sm:px-6 lg:px-10">
        {MOBILE_NAV.map((item) => (
          <DesktopNavItem key={item.label} item={item} />
        ))}
      </ul>
    </nav>
  );
}
