import type { ReactNode } from "react";
import { ChevronIcon } from "./shared";

export type AccordionItem = {
  id: string;
  title: ReactNode;
  content: ReactNode;
  defaultOpen?: boolean;
};

/**
 * v9 folding sections (`.mnav-links details` / `summary`): native <details>, so it works
 * without JS and screen readers announce expanded/collapsed. Pass `name` to make it
 * exclusive (one open at a time).
 */
export function Accordion({ items, name, className }: { items: AccordionItem[]; name?: string; className?: string }) {
  return (
    <div className={className}>
      {items.map((it) => (
        <details key={it.id} name={name} open={it.defaultOpen} className="group border-b border-sapil-line">
          <summary className="flex justify-between items-center text-[17px] font-[600] py-[14px] px-[4px] cursor-pointer list-none [&::-webkit-details-marker]:hidden [&_svg]:w-[18px] [&_svg]:h-[18px] [&_svg]:[transition:transform_.2s_var(--sapil-ease)] group-open:[&_svg]:[transform:rotate(180deg)]">
            {it.title}
            <ChevronIcon />
          </summary>
          <div className="flex flex-col pt-0 pr-[4px] pb-[12px] pl-[12px] text-[15px] text-sapil-ink-2">{it.content}</div>
        </details>
      ))}
    </div>
  );
}
