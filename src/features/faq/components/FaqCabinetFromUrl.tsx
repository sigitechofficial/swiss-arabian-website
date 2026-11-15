"use client";

import { useSearchParams } from "next/navigation";
import { FaqCabinet } from "./FaqCabinet";

/**
 * The FAQ with the drawer named in `?topic=` open (links from help, order and
 * returns pages). Read in the browser, so the FAQ page itself stays cached.
 */
export function FaqCabinetFromUrl() {
  const topic = useSearchParams().get("topic") ?? undefined;
  return <FaqCabinet key={topic ?? ""} initialDrawer={topic} />;
}
