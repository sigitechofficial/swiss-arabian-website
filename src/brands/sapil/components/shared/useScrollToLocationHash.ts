"use client";

import { useEffect, useRef } from "react";

/** The element the address's #section names, if it is on the page. */
export function locationHashTarget(hash: string, doc: Document = document): HTMLElement | null {
  const id = hash.startsWith("#") ? hash.slice(1) : hash;
  if (!id) return null;
  let decoded = id;
  try {
    decoded = decodeURIComponent(id);
  } catch {
    // keep the raw id
  }
  return doc.getElementById(decoded);
}

/**
 * Scrolls to the address's #section once `ready` turns true. Next scrolls to a
 * hash right after navigating ("/#mood" from another page), but a page that
 * draws its sections after loading data has no such element yet then.
 * Runs once per mount.
 */
export function useScrollToLocationHash(ready: boolean) {
  const done = useRef(false);
  useEffect(() => {
    if (!ready || done.current) return;
    done.current = true;
    const target = locationHashTarget(window.location.hash);
    target?.scrollIntoView({ block: "start" });
  }, [ready]);
}
