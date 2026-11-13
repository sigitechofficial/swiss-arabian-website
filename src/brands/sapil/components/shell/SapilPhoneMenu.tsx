"use client";

import Image from "next/image";
import { useEffect, useId, useRef, type MouseEvent } from "react";
import { useSapilCopy } from "../../i18n/SapilCopy";
import { IconButton, cx } from "../../ui";
import { SapilLink } from "../shared/SapilLink";
import { ChevronDownIcon, CloseIcon } from "../shared/icons";
import type { SapilLogo } from "./SapilHeader";
import { SapilLocaleSwitcher } from "./SapilLocaleSwitcher";
import { allOptions, type MenuItem, type ShopByChip } from "./shellData";

export type SapilPhoneMenuProps = {
  open: boolean;
  onClose: () => void;
  logo: SapilLogo;
  menu: MenuItem[];
  quickLinks: Array<Pick<ShopByChip, "id" | "label" | "href" | "sale">>;
  accountHref: string;
  onOpenSearch: () => void;
};

/** v9 `.mnav`: the menu as a panel from the reading start, dropdowns as folding sections. */
export function SapilPhoneMenu({ open, onClose, logo, menu, quickLinks, accountHref, onOpenSearch }: SapilPhoneMenuProps) {
  const t = useSapilCopy();
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const opener = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) {
      opener.current?.focus?.();
      opener.current = null;
      return;
    }
    opener.current = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const closeOnLink = (e: MouseEvent) => {
    if ((e.target as HTMLElement).closest("a")) onClose();
  };

  return (
    <>
      <div
        aria-hidden="true"
        onClick={onClose}
        className={cx(
          "fixed inset-0 bg-[rgba(30,27,24,.35)] [transition:opacity_.25s] z-[60]",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        )}
      />
      <nav
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        inert={!open}
        onClick={closeOnLink}
        className={cx(
          "fixed top-0 bottom-0 start-0 w-[min(360px,88%)] bg-sapil-white z-[61] flex flex-col pt-[16px] px-[20px] pb-[24px] overflow-y-auto [transition:transform_.35s_var(--sapil-ease)]",
          open ? "[transform:none]" : "[transform:translateX(-100%)] rtl:[transform:translateX(100%)]",
        )}
      >
        <h2 id={titleId} className="sr-only">
          {t("shell.menu")}
        </h2>
        <div className="flex justify-between items-center mb-[8px]">
          <Image src={logo.src} alt={logo.alt} width={logo.width} height={logo.height} className="h-[28px] w-auto" />
          <IconButton ref={closeRef} label={t("shell.closeMenu")} onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </div>
        <div className="flex flex-col mb-[24px]">
          {menu.map((item) => {
            const options = allOptions(item);
            if (!options.length) {
              return item.href ? (
                <SapilLink
                  key={item.id}
                  href={item.href}
                  className="text-[17px] font-[600] py-[14px] px-[4px] border-b border-sapil-line"
                >
                  {item.label}
                </SapilLink>
              ) : null;
            }
            return (
              <details key={item.id} className="group border-b border-sapil-line">
                <summary className="flex justify-between items-center text-[17px] font-[600] py-[14px] px-[4px] cursor-pointer list-none [&::-webkit-details-marker]:hidden [&_svg]:w-[18px] [&_svg]:h-[18px] [&_svg]:[transition:transform_.2s_var(--sapil-ease)] group-open:[&_svg]:[transform:rotate(180deg)]">
                  {item.label}
                  <ChevronDownIcon />
                </summary>
                <div className="flex flex-col pt-0 pe-[4px] pb-[12px] ps-[12px]">
                  {options.map((o) => (
                    <SapilLink key={o.id} href={o.href} className="text-[15px] font-[500] py-[9px] text-sapil-ink-2">
                      {o.label}
                    </SapilLink>
                  ))}
                  {item.href ? (
                    <SapilLink href={item.href} className="text-[15px] font-[500] py-[9px] text-sapil-ink-2">
                      {t("shell.menuSeeAll", { label: item.label })}
                    </SapilLink>
                  ) : null}
                </div>
              </details>
            );
          })}
        </div>
        {quickLinks.length ? (
          <>
            <p className="text-[12px] font-[700] tracking-[.08em] uppercase text-sapil-ink-2 me-[8px] mb-[12px]">
              {t("shell.quickLinks")}
            </p>
            <div className="flex flex-wrap gap-[8px] mb-[8px]">
              {quickLinks.map((q) => (
                <SapilLink
                  key={q.id}
                  href={q.href}
                  className={cx(
                    "text-[14px] font-[600] border border-sapil-line-2 rounded-full py-[8px] px-[14px]",
                    q.sale && "text-sapil-sale",
                  )}
                >
                  {q.label}
                </SapilLink>
              ))}
            </div>
          </>
        ) : null}
        <div className="flex gap-[20px] mt-[24px] text-[15px] font-[600] [&>*]:underline [&>*]:underline-offset-[3px]">
          <SapilLink href={accountHref}>{t("shell.accountLink")}</SapilLink>
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenSearch();
            }}
          >
            {t("shell.search")}
          </button>
        </div>
        <SapilLocaleSwitcher className="mt-[24px]" />
      </nav>
    </>
  );
}
