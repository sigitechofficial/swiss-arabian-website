"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  MOBILE_NAV,
  type MobileNavItem,
} from "@/features/home/constants/homeAssets";
import { useUiStore } from "@/stores/useUiStore";

function AccordionGroup({
  item,
  onNavigate,
}: {
  item: Extract<MobileNavItem, { type: "group" }>;
  onNavigate: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <li className="border-b border-sa-border">
      <button
        type="button"
        className="flex w-full items-center justify-between py-4 uppercase"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {item.label}
        <span
          className={`text-[11px] text-sa-muted transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        >
          ▾
        </span>
      </button>
      {open ? (
        <ul className="pb-3 pl-4 text-[13.5px] font-medium normal-case tracking-normal text-sa-muted">
          {item.children.map((child) =>
            "kind" in child && child.kind === "heading" ? (
              <li
                key={child.label}
                className="pt-2 text-[10.5px] font-bold uppercase tracking-[0.14em] text-gold first:pt-1"
              >
                {child.label}
              </li>
            ) : (
              <li key={child.label}>
                <Link
                  href={"href" in child ? child.href : "#"}
                  className="block py-2"
                  onClick={onNavigate}
                >
                  {child.label}
                </Link>
              </li>
            ),
          )}
        </ul>
      ) : null}
    </li>
  );
}

/** Full-page mobile menu — matches prototype nav sheet */
export function MobileNav() {
  const open = useUiStore((s) => s.mobileNavOpen);
  const setMobileNavOpen = useUiStore((s) => s.setMobileNavOpen);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMobileNavOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, setMobileNavOpen]);

  function close() {
    setMobileNavOpen(false);
  }

  return (
    <aside
      id="nav-sheet"
      className={`sa-scrollbar sa-scrollbar-panel fixed inset-0 z-[90] flex flex-col overflow-y-auto bg-page transition-transform duration-300 lg:hidden ${
        open ? "translate-x-0" : "translate-x-full pointer-events-none"
      }`}
      aria-label="Mobile menu"
      aria-hidden={!open}
    >
      <div className="flex items-center justify-between border-b border-sa-border px-6 py-5">
        <span className="font-sans text-sm font-semibold uppercase tracking-[0.2em] text-terra">
          Menu
        </span>
        <button
          type="button"
          className="flex size-10 items-center justify-center text-3xl leading-none text-sa-primary"
          aria-label="Close menu"
          onClick={close}
        >
          ×
        </button>
      </div>
      <nav className="flex-1" aria-label="Mobile">
        <ul className="flex flex-col px-6 py-3 text-[16px] font-semibold uppercase tracking-wide">
          {MOBILE_NAV.map((item) =>
            item.type === "link" ? (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className="block border-b border-sa-border py-4"
                  onClick={close}
                >
                  {item.label}
                </Link>
              </li>
            ) : (
              <AccordionGroup key={item.label} item={item} onNavigate={close} />
            ),
          )}
        </ul>
      </nav>
    </aside>
  );
}
