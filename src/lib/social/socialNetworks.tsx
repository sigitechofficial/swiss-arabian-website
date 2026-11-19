import type { ReactNode } from "react";

/**
 * Social networks the website footers draw an icon for (both brands). A footer
 * social link (Website → Pages → Footer) is matched by its id, label or address.
 */
export const SOCIAL_NETWORKS: Record<
  string,
  { label: string; icon: ReactNode }
> = {
  facebook: {
    label: "Facebook",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M13.5 21v-7h2.3l.4-2.8h-2.7V9.4c0-.8.3-1.4 1.5-1.4h1.3V5.6c-.6-.1-1.4-.2-2.3-.2-2.3 0-3.8 1.4-3.8 3.9v2H8v2.8h2.4V21h3.1z" />
      </svg>
    ),
  },
  youtube: {
    label: "YouTube",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M21.6 8.2c-.2-1-.9-1.7-1.9-1.9C18 6 12 6 12 6s-6 0-7.7.3c-1 .2-1.7.9-1.9 1.9C2.2 9.9 2.2 12 2.2 12s0 2.1.2 3.8c.2 1 .9 1.7 1.9 1.9C6 18 12 18 12 18s6 0 7.7-.3c1-.2 1.7-.9 1.9-1.9.2-1.7.2-3.8.2-3.8s0-2.1-.2-3.8zM10 15V9l5 3-5 3z" />
      </svg>
    ),
  },
  instagram: {
    label: "Instagram",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 7.2A4.8 4.8 0 1 0 12 16.8 4.8 4.8 0 0 0 12 7.2zm0 7.9A3.1 3.1 0 1 1 12 8.9a3.1 3.1 0 0 1 0 6.2zM17.4 6.8a1.12 1.12 0 1 1-2.24 0 1.12 1.12 0 0 1 2.24 0z" />
        <path d="M12 3.4c2.2 0 2.5 0 3.4.1 1.7.1 2.6.4 3.2 1 .6.6.9 1.5 1 3.2.1.9.1 1.2.1 3.4s0 2.5-.1 3.4c-.1 1.7-.4 2.6-1 3.2-.6.6-1.5.9-3.2 1-.9.1-1.2.1-3.4.1s-2.5 0-3.4-.1c-1.7-.1-2.6-.4-3.2-1-.6-.6-.9-1.5-1-3.2-.1-.9-.1-1.2-.1-3.4s0-2.5.1-3.4c.1-1.7.4-2.6 1-3.2.6-.6 1.5-.9 3.2-1 .9-.1 1.2-.1 3.4-.1zm0-1.6c-2.3 0-2.6 0-3.5.1-1.9.1-3.2.4-4.3 1.5-1.1 1.1-1.4 2.4-1.5 4.3-.1.9-.1 1.2-.1 3.5s0 2.6.1 3.5c.1 1.9.4 3.2 1.5 4.3 1.1 1.1 2.4 1.4 4.3 1.5.9.1 1.2.1 3.5.1s2.6 0 3.5-.1c1.9-.1 3.2-.4 4.3-1.5 1.1-1.1 1.4-2.4 1.5-4.3.1-.9.1-1.2.1-3.5s0-2.6-.1-3.5c-.1-1.9-.4-3.2-1.5-4.3-1.1-1.1-2.4-1.4-4.3-1.5-.9-.1-1.2-.1-3.5-.1z" />
      </svg>
    ),
  },
  whatsapp: {
    label: "WhatsApp",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M19.1 4.9A9.9 9.9 0 0 0 3.3 17.2L2 22l4.9-1.3A9.9 9.9 0 0 0 19.1 4.9zm-7.1 15.2a8.2 8.2 0 0 1-4.2-1.1l-.3-.2-2.9.8.8-2.8-.2-.3A8.2 8.2 0 1 1 12 20.1zm4.5-6.1c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.5.1-.2.2-.6.8-.7.9-.1.2-.3.2-.5.1-.2-.1-1-.4-1.9-1.2-.7-.6-1.2-1.4-1.3-1.6-.1-.2 0-.4.1-.5l.4-.5c.1-.1.1-.3.2-.4 0-.1 0-.3 0-.4 0-.1-.5-1.3-.7-1.8-.2-.5-.4-.4-.5-.4h-.4c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 1.9s.8 2.2.9 2.3c.1.2 1.6 2.5 3.9 3.4 1.5.6 2 .7 2.7.6.4-.1 1.4-.6 1.6-1.1.2-.5.2-1 .1-1.1-.1 0-.3-.1-.5-.2z" />
      </svg>
    ),
  },
  tiktok: {
    label: "TikTok",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M16 4c.3 2 1.5 3.4 3.5 3.6v2.4c-1.2 0-2.4-.4-3.5-1.1v5.4c0 2.9-2.1 5-4.9 5-2.7 0-4.8-2-4.8-4.7 0-2.8 2.3-4.9 5.3-4.6v2.5c-.4-.1-.8-.2-1.1-.2-1.2 0-2.1.9-2.1 2.1 0 1.3.9 2.2 2.2 2.2 1.3 0 2.3-1 2.3-2.6V4H16z" />
      </svg>
    ),
  },
  snapchat: {
    label: "Snapchat",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 3.2c2.4 0 4.4 1.7 4.4 4.6v.3c1.1.2 1.8 1 1.8 2.1 0 .5-.2.9-.6 1.2.1.5.5 1.4 1.5 1.9.3.2.4.6.2.9-.2.3-.6.4-1 .3-.8-.2-1.5-.1-2.1.2-.3.9-.9 1.6-2.1 2 .4.3 1.2.7 1.2 1.3 0 .5-.5.8-1.2.8-.3 0-.6 0-.8-.1-.1 1.1-.6 2.1-2.3 2.1s-2.2-1-2.3-2.1c-.2.1-.5.1-.8.1-.7 0-1.2-.3-1.2-.8 0-.6.8-1 1.2-1.3-1.2-.4-.9-1.1-2.1-2-.6-.3-1.3-.4-2.1-.2-.4.1-1 0-1-.3-.2-.3-.1-.7.2-.9 1-.5.9-1.4 1.5-1.9-.4-.3-.6-.7-.6-1.2 0-1.1.7-1.9 1.8-2.1v-.3c0-2.9 2-4.6 4.4-4.6z" />
      </svg>
    ),
  },
  twitter: {
    label: "X",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M17.8 3h3.1l-6.8 7.7 8 10.3h-6.3l-4.9-6.4L5.3 21H2.2l7.3-8.3L1.8 3h6.4l4.4 5.9L17.8 3zm-1.1 16.2h1.7L7.4 4.7H5.6l11.1 14.5z" />
      </svg>
    ),
  },
  pinterest: {
    label: "Pinterest",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 2a10 10 0 0 0-3.6 19.3c-.1-.8-.2-2 0-2.9l1.2-5s-.3-.6-.3-1.5c0-1.4.8-2.4 1.8-2.4.9 0 1.3.6 1.3 1.4 0 .9-.5 2.1-.8 3.3-.2 1 .5 1.8 1.5 1.8 1.8 0 3.2-1.9 3.2-4.6 0-2.4-1.7-4.1-4.2-4.1-2.9 0-4.5 2.1-4.5 4.4 0 .9.3 1.8.8 2.3.1.1.1.2.1.3l-.3 1.2c0 .2-.2.2-.4.1-1.3-.6-2.1-2.5-2.1-4 0-3.3 2.4-6.3 6.9-6.3 3.6 0 6.4 2.6 6.4 6 0 3.6-2.3 6.5-5.4 6.5-1.1 0-2.1-.6-2.4-1.2l-.7 2.5c-.2.9-.9 2.1-1.3 2.8A10 10 0 1 0 12 2z" />
      </svg>
    ),
  },
  linkedin: {
    label: "LinkedIn",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M6.5 9.2H4V20h2.5V9.2zM5.2 4A1.5 1.5 0 1 0 5.2 7a1.5 1.5 0 0 0 0-3zM20 20h-2.5v-5.6c0-1.5-.5-2.5-1.8-2.5-1 0-1.5.7-1.8 1.3-.1.2-.1.6-.1.9V20H11V9.2h2.4v1.5c.4-.7 1.3-1.8 3.2-1.8 2.3 0 4 1.5 4 4.8V20z" />
      </svg>
    ),
  },
};

/** The address's host without "www." ("" when it isn't a full address). */
function hostOf(href: string): string {
  try {
    return new URL(href).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}

/** Which network a configured social link is (by id, label or address). */
export function socialNetwork(link: {
  id: string;
  label: string;
  href: string;
}) {
  const text = `${link.id} ${link.label} ${link.href}`.toLowerCase();
  if (text.includes("wa.me")) return SOCIAL_NETWORKS.whatsapp;
  if (text.includes("youtu")) return SOCIAL_NETWORKS.youtube;
  if (hostOf(link.href) === "x.com" || text.includes("twitter"))
    return SOCIAL_NETWORKS.twitter;
  return (
    Object.entries(SOCIAL_NETWORKS).find(([key]) => text.includes(key))?.[1] ??
    null
  );
}
