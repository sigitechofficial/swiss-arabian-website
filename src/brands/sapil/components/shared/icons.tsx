/* v9 inline icons used by the Sapil chrome and home (24px viewBox, currentColor). */
import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;
const base = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", "aria-hidden": true } as const;

export const MenuIcon = (p: P) => (
  <svg {...base} strokeWidth="1.6" {...p}>
    <path d="M4 7h16M4 12h16M4 17h10" />
  </svg>
);
export const SearchIcon = (p: P) => (
  <svg {...base} strokeWidth="1.6" {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m16 16 4.5 4.5" />
  </svg>
);
export const AccountIcon = (p: P) => (
  <svg {...base} strokeWidth="1.6" {...p}>
    <circle cx="12" cy="8.5" r="3.8" />
    <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
  </svg>
);
export const BagIcon = (p: P) => (
  <svg {...base} strokeWidth="1.6" {...p}>
    <path d="M5 8h14l-1.2 12.2H6.2Z" />
    <path d="M9 10V7a3 3 0 0 1 6 0v3" />
  </svg>
);
export const CloseIcon = (p: P) => (
  <svg {...base} strokeWidth="1.6" {...p}>
    <path d="m6 6 12 12M18 6 6 18" />
  </svg>
);
export const ChevronDownIcon = (p: P) => (
  <svg {...base} strokeWidth="1.8" {...p}>
    <path d="m7 10 5 5 5-5" />
  </svg>
);
/** Rail arrows point to the reading direction's start / end (flipped in RTL by the caller). */
export const PrevIcon = (p: P) => (
  <svg {...base} strokeWidth="1.6" {...p}>
    <path d="m14.5 6-6 6 6 6" />
  </svg>
);
export const NextIcon = (p: P) => (
  <svg {...base} strokeWidth="1.6" {...p}>
    <path d="m9.5 6 6 6-6 6" />
  </svg>
);
export const ArrowIcon = ({ strokeWidth = 1.8, ...p }: P) => (
  <svg {...base} strokeWidth={strokeWidth} {...p}>
    <path d="M5 12h14m-5-5 5 5-5 5" />
  </svg>
);
export const PlusIcon = (p: P) => (
  <svg {...base} strokeWidth="1.8" {...p}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);
export const HeartIcon = ({ filled, ...p }: P & { filled?: boolean }) => (
  <svg {...base} strokeWidth="1.8" fill={filled ? "currentColor" : "none"} {...p}>
    <path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z" />
  </svg>
);
export const ChatIcon = (p: P) => (
  <svg {...base} strokeWidth="1.8" {...p}>
    <path d="M20 11.5a8 8 0 0 1-11.8 7L4 20l1.5-4.2A8 8 0 1 1 20 11.5Z" />
  </svg>
);
export const SendIcon = (p: P) => (
  <svg {...base} strokeWidth="1.8" {...p}>
    <path d="m21 3-9.5 9.5M21 3l-6 18-3.5-8.5L3 9Z" />
  </svg>
);
export const PlayIcon = (p: P) => (
  <svg viewBox="0 0 24 24" aria-hidden {...p}>
    <path d="M7 4.5v15l13-7.5Z" fill="currentColor" />
  </svg>
);
export const MutedIcon = (p: P) => (
  <svg {...base} strokeWidth="1.8" {...p}>
    <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4Z" />
    <path d="m16 9.5 5 5m0-5-5 5" />
  </svg>
);
export const SoundIcon = (p: P) => (
  <svg {...base} strokeWidth="1.8" {...p}>
    <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4Z" />
    <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" />
  </svg>
);
export const InstagramIcon = (p: P) => (
  <svg {...base} strokeWidth="1.8" {...p}>
    <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.2" cy="6.8" r=".8" fill="currentColor" />
  </svg>
);
