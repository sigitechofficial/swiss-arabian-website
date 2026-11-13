"use client";

import { useEffect, useState } from "react";

/** Shared across every card on the page: `true` decoded, `false` failed. */
const imageStatus = new Map<string, boolean>();

/** Hover effects only show on a mouse or trackpad (`productCard` CSS uses the same query). */
const HOVER_MEDIA = "(hover: hover) and (pointer: fine)";

type IdleWindow = Window & {
  requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
  cancelIdleCallback?: (id: number) => void;
};

/** Run `fn` once the browser is idle, so preloads don't compete with the page's first images. */
function whenIdle(fn: () => void): () => void {
  const w = window as IdleWindow;
  if (w.requestIdleCallback) {
    const id = w.requestIdleCallback(fn, { timeout: 3000 });
    return () => w.cancelIdleCallback?.(id);
  }
  const id = window.setTimeout(fn, 1500);
  return () => window.clearTimeout(id);
}

export type UseLoadedImagesOptions = {
  /**
   * The images are only ever shown on hover. On touch screens nothing is
   * loaded, since the hover state never appears there.
   */
  hoverOnly?: boolean;
};

/**
 * Which of `urls` have actually loaded and decoded.
 *
 * Cards swap to a second "ingredients" image on hover by fading the bottle
 * shot out. Many live catalog media URLs 404, and fading out onto a broken
 * background left the card blank — so a hover image is only used once it's
 * confirmed good. Decoding ahead (after the page is idle) also keeps the first
 * crossfade smooth.
 */
export function useLoadedImages(
  urls: readonly (string | null | undefined)[],
  { hoverOnly = false }: UseLoadedImagesOptions = {},
): ReadonlySet<string> {
  const key = urls.filter(Boolean).join("\n");
  const [, setVersion] = useState(0);

  useEffect(() => {
    const pending = key ? key.split("\n").filter((url) => !imageStatus.has(url)) : [];
    if (pending.length === 0) return;
    if (hoverOnly && !window.matchMedia(HOVER_MEDIA).matches) return;
    let active = true;
    const cancelIdle = whenIdle(() => {
      for (const url of pending) {
        if (imageStatus.has(url)) continue;
        const img = new Image();
        img.src = url;
        img
          .decode()
          .then(() => {
            imageStatus.set(url, true);
            if (active) setVersion((v) => v + 1);
          })
          .catch(() => {
            imageStatus.set(url, false);
            if (active) setVersion((v) => v + 1);
          });
      }
    });
    return () => {
      active = false;
      cancelIdle();
    };
  }, [key, hoverOnly]);

  return new Set(key ? key.split("\n").filter((url) => imageStatus.get(url) === true) : []);
}

/** Every one of `urls` has finished — loaded or failed. Pair with `useLoadedImages`. */
export function imagesSettled(urls: readonly (string | null | undefined)[]): boolean {
  return urls.every((url) => !url || imageStatus.has(url));
}
