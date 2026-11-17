"use client";

import type { ReactNode } from "react";
import type { AnnouncementItem } from "@/features/cms/hooks/useCmsGlobalRegion";
import { cx } from "../../ui/shared";
import { SapilAnnouncement } from "./SapilAnnouncement";

export type SapilTopBarProps = {
  /** The market's announcement messages (CMS); none leaves the centre empty. */
  items: AnnouncementItem[];
  intervalMs?: number | null;
  /** The announcement is still loading: hold the bar's height (no layout shift). */
  pending?: boolean;
  /** The "Ship to" and language dropdowns: at the end of the bar (on phones only when there is no message). */
  tools?: ReactNode;
};

/**
 * The bar above the header, like Swiss Arabian's top bar in the v9 `.announce`
 * look (mint, 41px, centred text): the announcement in the middle and the market
 * and language dropdowns at the end (right in LTR, left in RTL). It always shows,
 * on every screen, messages or not. Below 760px there is room for one of the two:
 * the announcement when there is one, else the dropdowns, centred (the phone menu
 * has them too). It sits above the sticky header so the dropdown lists open over it.
 */
export function SapilTopBar({ items, intervalMs, pending = false, tools }: SapilTopBarProps) {
  const hasMessage = items.length > 0;
  return (
    <div
      data-sapil-topbar=""
      className={cx(
        "relative z-[50] bg-sapil-p-mint text-sapil-ink min-h-[41px] grid grid-cols-[minmax(0,1fr)_minmax(0,auto)_1fr] items-center max-760:grid-cols-1",
      )}
    >
      <span aria-hidden="true" className="max-760:hidden" />
      <div className={cx("min-w-0", !hasMessage && !pending && "max-760:hidden")} data-sapil-topbar-message="">
        {pending ? (
          <div aria-hidden="true" data-sapil-reserve="announce" className="h-[41px]" />
        ) : hasMessage ? (
          <SapilAnnouncement items={items} intervalMs={intervalMs} />
        ) : null}
      </div>
      <div
        className={cx(
          "flex items-center justify-end ps-[8px] pe-[16px]",
          hasMessage || pending ? "max-760:hidden" : "max-760:justify-center max-760:px-[16px] max-760:py-[5px]",
        )}
        data-sapil-topbar-tools=""
      >
        {tools}
      </div>
    </div>
  );
}
