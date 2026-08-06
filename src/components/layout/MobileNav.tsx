"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MOBILE_NAV,
  type MobileNavItem,
} from "@/features/home/constants/homeAssets";
import { performLogout } from "@/features/auth";
import { useAuthStore } from "@/stores/useAuthStore";
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
      <div className="flex w-full items-center justify-between py-4 uppercase">
        {item.href ? (
          <Link href={item.href} className="flex-1" onClick={onNavigate}>
            {item.label}
          </Link>
        ) : (
          <span className="flex-1">{item.label}</span>
        )}
        <button
          type="button"
          className="flex size-8 items-center justify-center"
          aria-expanded={open}
          aria-label={`${open ? "Collapse" : "Expand"} ${item.label}`}
          onClick={() => setOpen((v) => !v)}
        >
          <span
            className={`text-[11px] text-sa-muted transition-transform ${open ? "rotate-180" : ""}`}
            aria-hidden
          >
            ▾
          </span>
        </button>
      </div>
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
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

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

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await performLogout();
      close();
      router.push("/");
    } finally {
      setLoggingOut(false);
    }
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

      <div className="mt-auto border-t border-sa-border px-6 py-6">
        <ul className="flex flex-col gap-1 text-[15px] font-semibold uppercase tracking-wide">
          <li>
            <Link
              href="/stores"
              className="block py-3 text-sa-primary"
              onClick={close}
            >
              Stores
            </Link>
          </li>
          {isAuthenticated ? (
            <li>
              <button
                type="button"
                disabled={loggingOut}
                onClick={() => void handleLogout()}
                className="block w-full py-3 text-left text-sa-secondary transition-colors hover:text-terra disabled:opacity-60"
              >
                {loggingOut ? "Signing out…" : "Logout"}
              </button>
            </li>
          ) : null}
        </ul>
      </div>
    </aside>
  );
}
