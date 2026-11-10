"use client";

import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { localeFromPathname } from "@/lib/i18n/localePath";
import { pdpShare, pdpShareBtn, pdpShareLabel, pdpShareList, pdpShareStatus } from "@/styles/pdpChrome";
import { shareLinks } from "../../utils/shareLinks";

const COPY = {
  en: {
    share: "Share",
    shareOn: "Share on",
    native: "Share this product",
    copy: "Copy link",
    copied: "Link copied",
    copyFailed: "Could not copy the link",
    newTab: "(opens in a new tab)",
  },
  ar: {
    share: "مشاركة",
    shareOn: "مشاركة عبر",
    native: "مشاركة هذا المنتج",
    copy: "نسخ الرابط",
    copied: "تم نسخ الرابط",
    copyFailed: "تعذّر نسخ الرابط",
    newTab: "(يفتح في نافذة جديدة)",
  },
} as const;

const noSubscribe = () => () => {};

/** Native share sheet on touch devices that offer one (checked after hydration). */
function useNativeShare(): boolean {
  return useSyncExternalStore(
    noSubscribe,
    () =>
      typeof navigator.share === "function" &&
      window.matchMedia("(pointer: coarse)").matches,
    () => false,
  );
}

/**
 * Quiet share row for the product page: WhatsApp, Facebook, X, Pinterest and
 * copy link (or the phone's own share sheet). Plain links; `url` is the
 * product's canonical address.
 */
export function PdpShare({ url, title, image }: { url: string; title: string; image?: string | null }) {
  const locale = localeFromPathname(usePathname() || "/");
  const copy = COPY[locale];
  const native = useNativeShare();
  const [status, setStatus] = useState<"" | "copied" | "failed">("");
  const links = shareLinks({ url, title, image });

  useEffect(() => {
    if (!status) return;
    const id = window.setTimeout(() => setStatus(""), 2500);
    return () => window.clearTimeout(id);
  }, [status]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setStatus("copied");
    } catch {
      setStatus("failed");
    }
  }

  async function shareNatively() {
    try {
      await navigator.share({ title, url });
    } catch {
      // Closed by the shopper, or not allowed: nothing to report.
    }
  }

  const networks: Array<{ key: string; name: string; href: string | null; icon: ReactNode }> = [
    { key: "whatsapp", name: "WhatsApp", href: links.whatsapp, icon: <WhatsAppIcon /> },
    { key: "facebook", name: "Facebook", href: links.facebook, icon: <FacebookIcon /> },
    { key: "x", name: "X", href: links.x, icon: <XIcon /> },
    { key: "pinterest", name: "Pinterest", href: links.pinterest, icon: <PinterestIcon /> },
  ];

  return (
    <div className={pdpShare}>
      <span className={pdpShareLabel} id="pdp-share-label">
        {copy.share}
      </span>
      <ul className={pdpShareList} role="list" aria-labelledby="pdp-share-label">
        {native ? (
          <li>
            <button type="button" className={pdpShareBtn} onClick={shareNatively} aria-label={copy.native}>
              <ShareIcon />
            </button>
          </li>
        ) : (
          networks.map((network) =>
            network.href ? (
              <li key={network.key}>
                <a
                  className={pdpShareBtn}
                  href={network.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${copy.shareOn} ${network.name} ${copy.newTab}`}
                >
                  {network.icon}
                </a>
              </li>
            ) : null,
          )
        )}
        <li>
          <button type="button" className={pdpShareBtn} onClick={copyLink} aria-label={copy.copy}>
            {status === "copied" ? <CheckIcon /> : <LinkIcon />}
          </button>
        </li>
      </ul>
      <span className={pdpShareStatus} role="status" aria-live="polite">
        {status === "copied" ? copy.copied : status === "failed" ? copy.copyFailed : ""}
      </span>
    </div>
  );
}

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <Icon>
      <path d="M3.5 20.5l1.3-4.2A8.5 8.5 0 1 1 8 19.4z" />
      <path d="M9.2 8.3c.2-.4.6-.4.8 0l.6 1.4c.1.3 0 .6-.2.8l-.5.5c.6 1.2 1.6 2.2 2.8 2.8l.5-.5c.2-.2.5-.3.8-.2l1.4.6c.4.2.4.6 0 .8-.5.6-1.2.9-1.9.8-2.6-.4-4.8-2.6-5.2-5.2-.1-.7.2-1.4.8-1.8z" />
    </Icon>
  );
}

function FacebookIcon() {
  return (
    <Icon>
      <path d="M14.5 21v-7.5h2.6l.4-3h-3V8.7c0-.9.3-1.5 1.5-1.5h1.6V4.5a20 20 0 0 0-2.4-.1c-2.4 0-3.9 1.4-3.9 4v2.1H8.6v3h2.7V21" />
    </Icon>
  );
}

function XIcon() {
  return (
    <Icon>
      <path d="M4 4l16 16M20 4l-6.4 7.3M10.4 12.7L4 20" />
    </Icon>
  );
}

function PinterestIcon() {
  return (
    <Icon>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M11.2 9.8l-2.4 10.4" />
      <path d="M10.4 13.2c.5.6 1.2.9 2 .9 2 0 3.3-1.8 3.3-3.9 0-2-1.6-3.6-3.9-3.6-2.5 0-4.1 1.8-4.1 3.8 0 .8.3 1.5.8 1.9" />
    </Icon>
  );
}

function LinkIcon() {
  return (
    <Icon>
      <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" />
      <path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />
    </Icon>
  );
}

function CheckIcon() {
  return (
    <Icon>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </Icon>
  );
}

function ShareIcon() {
  return (
    <Icon>
      <path d="M12 15V3.5M8 7.5l4-4 4 4" />
      <path d="M5 12v7.5h14V12" />
    </Icon>
  );
}
