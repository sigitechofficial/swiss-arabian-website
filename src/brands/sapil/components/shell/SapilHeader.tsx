"use client";

import { MediaImage } from "@/components/ui/MediaImage";
import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { useSapilCopy } from "../../i18n/SapilCopy";
import { IconButton, Wrap, cx, tintValue } from "../../ui";
import { SapilLink } from "../shared/SapilLink";
import { AccountIcon, BagIcon, ChevronDownIcon, MenuIcon, SearchIcon } from "../shared/icons";
import { isCurrentHref, pastelAt, type MenuItem, type MenuLink } from "./shellData";

export type SapilLogo = { src: string; alt: string; width: number; height: number };

export type SapilHeaderProps = {
  logo: SapilLogo;
  menu: MenuItem[];
  /** Menu still loading: placeholders keep the header's height. */
  menuLoading?: boolean;
  /** Current path without the language prefix (marks the open page). */
  pathname: string;
  bagCount: number;
  accountHref: string;
  onOpenMenu: () => void;
  onOpenSearch: () => void;
  onOpenBag: () => void;
};

const NAV_ITEM =
  "inline-flex items-center gap-[4px] h-[44px] px-[11px] rounded-[10px] text-[14px] font-[600] text-sapil-ink whitespace-nowrap [transition:background_.18s] hover:bg-sapil-paper aria-[current=page]:bg-sapil-paper";

function MegaTile({ option, index }: { option: MenuLink; index: number }) {
  return (
    <SapilLink
      href={option.href}
      style={{ "--c": tintValue(pastelAt(index)) } as CSSProperties}
      className="flex flex-col items-center bg-[var(--c)] rounded-[18px] pt-[12px] px-[8px] pb-[14px] text-center [transition:transform_.3s_var(--sapil-ease)] hover:[transform:translateY(-3px)]"
    >
      {option.image ? (
        // eslint-disable-next-line @next/next/no-img-element -- collection pictures from the menu API, any host
        <img
          src={option.image}
          alt=""
          loading="lazy"
          className="h-[84px] w-auto object-contain [filter:drop-shadow(0_10px_10px_rgba(22,20,15,.16))]"
        />
      ) : null}
      <b className={cx("text-[14px] font-[600] leading-[1.2]", option.image && "mt-[10px]")}>{option.label}</b>
    </SapilLink>
  );
}

function MegaPanel({ item, id, onNavigate }: { item: MenuItem; id: string; onNavigate: () => void }) {
  const t = useSapilCopy();
  const wide = item.columns.length > 0;
  return (
    <div
      id={id}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest("a")) onNavigate();
      }}
      className={cx(
        "absolute top-[calc(100%-4px)] left-1/2 [transform:translateX(-50%)] bg-sapil-white rounded-[24px] pt-[20px] px-[20px] pb-[22px] z-[45] shadow-[0_2px_4px_rgba(60,45,30,.06),0_30px_60px_-24px_rgba(60,45,30,.35)]",
        wide ? "w-[min(1180px,calc(100vw-48px))]" : "w-[min(940px,calc(100vw-48px))]",
      )}
    >
      {wide ? (
        <div className="grid grid-cols-[4fr_5fr] gap-[20px] mb-[18px] max-900:grid-cols-1">
          {item.options.length ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-[10px]">
              {item.options.map((o, i) => (
                <MegaTile key={o.id} option={o} index={i} />
              ))}
            </div>
          ) : null}
          {item.columns.map((col) => (
            <div key={col.id}>
              <p className="text-[12px] font-[700] tracking-[.1em] uppercase text-sapil-muted mt-0 mb-[10px] ms-[4px]">{col.heading}</p>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-[10px]">
                {col.links.map((o, i) => (
                  <MegaTile key={o.id} option={o} index={i + 3} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-5 gap-[10px] mb-[18px]">
          {item.options.map((o, i) => (
            <MegaTile key={o.id} option={o} index={i} />
          ))}
        </div>
      )}
      {item.href ? (
        <SapilLink
          href={item.href}
          className="font-[600] text-[14px] ms-[4px] border-b border-current pb-[2px] [transition:color_.18s] hover:text-sapil-accent"
        >
          {t("shell.menuSeeAll", { label: item.label })}
        </SapilLink>
      ) : null}
    </div>
  );
}

/** v9 `.hdr`: logo, main menu with dropdown panels, search, account, bag with count. */
export function SapilHeader({
  logo,
  menu,
  menuLoading,
  pathname,
  bagCount,
  accountHref,
  onOpenMenu,
  onOpenSearch,
  onOpenBag,
}: SapilHeaderProps) {
  const t = useSapilCopy();
  const baseId = useId();
  const [open, setOpen] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const closeTimer = useRef<number | null>(null);
  const navRef = useRef<HTMLElement>(null);

  const [lastCount, setLastCount] = useState(bagCount);
  const [bumps, setBumps] = useState(0);
  if (lastCount !== bagCount) {
    setLastCount(bagCount);
    if (bagCount > lastCount) setBumps((n) => n + 1);
  }

  // Close the dropdown when the page changes (adjusting state while rendering).
  const [menuPath, setMenuPath] = useState(pathname);
  if (menuPath !== pathname) {
    setMenuPath(pathname);
    setOpen(null);
  }

  useEffect(() => {
    let frame = 0;
    const read = () => {
      frame = 0;
      setScrolled(window.scrollY > 8);
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(read);
    };
    read();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!navRef.current?.contains(e.target as Node)) setOpen(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(null);
      navRef.current?.querySelector<HTMLButtonElement>(`[data-dd="${open}"]`)?.focus();
    };
    document.addEventListener("click", onDoc);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onDoc);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(
    () => () => {
      if (closeTimer.current) window.clearTimeout(closeTimer.current);
    },
    [],
  );

  const hoverable = () => typeof window !== "undefined" && window.matchMedia("(hover: hover)").matches;
  const enter = (id: string) => {
    if (!hoverable()) return;
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    setOpen(id);
  };
  const leave = () => {
    if (!hoverable()) return;
    closeTimer.current = window.setTimeout(() => setOpen(null), 180);
  };

  return (
    <header
      data-sapil-header=""
      className={cx(
        "sticky top-0 z-[40] bg-sapil-white border-b border-sapil-line [transition:box-shadow_.2s]",
        scrolled && "shadow-[0_10px_24px_-20px_rgba(60,45,30,.4)]",
      )}
    >
      <Wrap className="relative flex items-center gap-[24px] h-[76px] max-1280:gap-[8px] max-900:h-[64px]">
        <span className="hidden max-1280:contents">
          <IconButton label={t("shell.openMenu")} onClick={onOpenMenu}>
            <MenuIcon />
          </IconButton>
        </span>
        <SapilLink href="/" aria-label={t("shell.home")} className="max-1280:mx-auto">
          <MediaImage
            src={logo.src}
            alt={logo.alt}
            width={logo.width}
            height={logo.height}
            preload
            className="h-[34px] w-auto max-900:h-[28px]"
          />
        </SapilLink>
        <nav ref={navRef} aria-label={t("shell.mainMenu")} className="flex items-center mx-auto max-1280:hidden">
          {menuLoading && !menu.length
            ? Array.from({ length: 6 }, (_, i) => (
                <span key={i} aria-hidden="true" className="mx-[11px] h-[12px] w-[64px] rounded-full bg-sapil-sand animate-pulse" />
              ))
            : menu.map((item) => {
                const hasPanel = item.options.length > 0 || item.columns.length > 0;
                const current = item.href ? isCurrentHref(item.href, pathname) : false;
                if (!hasPanel) {
                  return item.href ? (
                    <SapilLink
                      key={item.id}
                      href={item.href}
                      aria-current={current ? "page" : undefined}
                      className={NAV_ITEM}
                    >
                      {item.label}
                    </SapilLink>
                  ) : null;
                }
                const panelId = `${baseId}-mega-${item.id}`;
                const isOpen = open === item.id;
                return (
                  <div key={item.id} onMouseEnter={() => enter(item.id)} onMouseLeave={leave}>
                    <button
                      type="button"
                      data-dd={item.id}
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      aria-current={current ? "page" : undefined}
                      onClick={() => setOpen(isOpen ? null : item.id)}
                      className={cx(
                        NAV_ITEM,
                        "aria-expanded:bg-sapil-paper [&_svg]:w-[16px] [&_svg]:h-[16px] [&_svg]:[transition:transform_.2s_var(--sapil-ease)] aria-expanded:[&_svg]:[transform:rotate(180deg)]",
                      )}
                    >
                      {item.label}
                      <ChevronDownIcon />
                    </button>
                    {isOpen ? <MegaPanel item={item} id={panelId} onNavigate={() => setOpen(null)} /> : null}
                  </div>
                );
              })}
        </nav>
        <div className="flex items-center gap-[2px] max-1280:min-w-[88px] max-1280:justify-end">
          <IconButton label={t("shell.search")} onClick={onOpenSearch}>
            <SearchIcon />
          </IconButton>
          <span className="contents max-1280:hidden">
            <IconButton label={t("shell.account")} href={accountHref} LinkComponent={SapilLink}>
              <AccountIcon />
            </IconButton>
          </span>
          <IconButton label={t("shell.bagLabel", { count: bagCount })} onClick={onOpenBag}>
            <BagIcon />
            {/* v9 .bag-count; re-mounted (and bumped) only when the count goes up */}
            <span
              key={bumps}
              aria-hidden="true"
              className={cx(
                "absolute top-[4px] end-[2px] min-w-[18px] h-[18px] px-[5px] rounded-[9px] bg-sapil-accent text-sapil-white text-[11px] font-[700] grid place-items-center tabular-nums",
                bumps > 0 && "animate-sapil-bump",
              )}
            >
              {bagCount}
            </span>
          </IconButton>
        </div>
      </Wrap>
    </header>
  );
}
