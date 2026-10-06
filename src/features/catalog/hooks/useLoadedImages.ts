"use client";

import { useEffect, useState } from "react";

/** Shared across every card on the page: `true` decoded, `false` failed. */
const imageStatus = new Map<string, boolean>();

/**
 * Which of `urls` have actually loaded and decoded.
 *
 * Cards swap to a second "ingredients" image on hover by fading the bottle
 * shot out. Many live catalog media URLs 404, and fading out onto a broken
 * background left the card blank — so a hover image is only used once it's
 * confirmed good. Decoding up front also keeps the first crossfade smooth.
 */
export function useLoadedImages(urls: readonly (string | null | undefined)[]): ReadonlySet<string> {
  const key = urls.filter(Boolean).join("\n");
  const [, setVersion] = useState(0);

  useEffect(() => {
    const pending = key ? key.split("\n").filter((url) => !imageStatus.has(url)) : [];
    if (pending.length === 0) return;
    let active = true;
    for (const url of pending) {
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
    return () => {
      active = false;
    };
  }, [key]);

  return new Set(key ? key.split("\n").filter((url) => imageStatus.get(url) === true) : []);
}

/** Every one of `urls` has finished — loaded or failed. Pair with `useLoadedImages`. */
export function imagesSettled(urls: readonly (string | null | undefined)[]): boolean {
  return urls.every((url) => !url || imageStatus.has(url));
}
