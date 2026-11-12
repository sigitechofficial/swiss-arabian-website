"use client";

import { useEffect, useRef } from "react";
import type { OnsiteMessage } from "../types";

type Props = {
  message: OnsiteMessage;
  onDismiss: () => void;
  onCta: () => void;
};

/**
 * Renders the message the backend chose. A popup is a dialog (focus moves to Close, Escape and a
 * click outside dismiss it); a banner is a bar under the header. No rule logic lives here.
 */
export function OnsiteMessageView({ message, onDismiss, onCta }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const isPopup = message.slot === "POPUP";

  useEffect(() => {
    if (!isPopup) return;
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onDismiss();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isPopup, onDismiss]);

  const cta =
    message.ctaLabel && message.ctaUrl ? (
      <a
        href={message.ctaUrl}
        onClick={onCta}
        className="inline-flex items-center justify-center rounded-full bg-terra px-5 py-2.5 text-sm font-medium text-white no-underline transition-opacity hover:opacity-90"
        data-onsite-cta
      >
        {message.ctaLabel}
      </a>
    ) : null;

  if (!isPopup) {
    return (
      <div
        role="region"
        aria-label={message.title}
        data-onsite-message="BANNER"
        // Above the fixed site header (z-200) and anchored to the bottom, so it never hides the menu.
        className="fixed inset-x-0 bottom-0 z-[210] flex items-center justify-center gap-4 bg-sa-primary px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] text-sm text-white"
      >
        <p className="m-0">
          <strong className="font-medium">{message.title}</strong>
          {message.body ? <span className="ml-2 opacity-90">{message.body}</span> : null}
        </p>
        {message.ctaLabel && message.ctaUrl ? (
          <a href={message.ctaUrl} onClick={onCta} className="underline" data-onsite-cta>
            {message.ctaLabel}
          </a>
        ) : null}
        <button type="button" onClick={onDismiss} aria-label="Close" className="ml-2 cursor-pointer text-lg leading-none">
          ×
        </button>
      </div>
    );
  }

  return (
    <div
      // Above the fixed site header (z-200) so the backdrop covers the whole page.
      className="fixed inset-0 z-[220] flex items-center justify-center bg-black/45 p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) onDismiss();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="onsite-title"
        data-onsite-message="POPUP"
        className="relative w-full max-w-sm rounded-2xl bg-page p-7 text-center text-sa-primary shadow-xl"
      >
        <button
          ref={closeRef}
          type="button"
          onClick={onDismiss}
          aria-label="Close"
          className="absolute right-3 top-3 flex size-8 cursor-pointer items-center justify-center rounded-full text-xl leading-none hover:bg-black/5"
        >
          ×
        </button>
        <h2 id="onsite-title" className="m-0 mb-2 text-xl">
          {message.title}
        </h2>
        {message.body ? <p className="m-0 mb-5 text-sm opacity-80">{message.body}</p> : null}
        {cta}
      </div>
    </div>
  );
}
