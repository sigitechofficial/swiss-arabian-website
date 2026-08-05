import Image from "next/image";

import { accountAssets } from "../constants/accountAssets";

export type AccountStatusTone =
  | "success"
  | "danger"
  | "warning"
  | "accent"
  | "muted";

const DOT: Partial<Record<AccountStatusTone, string>> = {
  success: accountAssets.dots.paid,
  danger: accountAssets.dots.refunded,
  warning: accountAssets.dots.scheduled,
};

const TEXT: Record<AccountStatusTone, string> = {
  success: "text-[#2e9961]",
  danger: "text-[#b4483f]",
  warning: "text-[#b7935b]",
  accent: "text-terra",
  muted: "text-sa-secondary",
};

type AccountStatusLabelProps = {
  label: string;
  tone: AccountStatusTone;
};

/** Figma · Tx status cell (1318:10067) — 7px dot + 12px semibold label */
export function AccountStatusLabel({ label, tone }: AccountStatusLabelProps) {
  const dot = DOT[tone];

  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
      {dot ? (
        <Image src={dot} alt="" width={7} height={7} className="h-[7px] w-[7px]" />
      ) : null}
      <span className={`text-[12px] font-semibold ${TEXT[tone]}`}>{label}</span>
    </span>
  );
}

const PILL: Record<AccountStatusTone, string> = {
  success: "bg-[#e0f6e7] text-[#1a7338]",
  danger: "bg-[#fbe9e7] text-[#b4483f]",
  warning: "bg-[#f7efdd] text-[#8a6a2f]",
  accent: "bg-[#f6ece8] text-terra",
  muted: "bg-section-soft text-sa-secondary",
};

/** Figma · badge-active (1236:9637) — rounded status pill */
export function AccountStatusPill({ label, tone }: AccountStatusLabelProps) {
  const dot = tone === "success" ? accountAssets.dots.active : DOT[tone];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 ${PILL[tone]}`}
    >
      {dot ? (
        <Image src={dot} alt="" width={7} height={7} className="h-[7px] w-[7px]" />
      ) : null}
      <span className="text-[11px] font-bold leading-none">{label}</span>
    </span>
  );
}
