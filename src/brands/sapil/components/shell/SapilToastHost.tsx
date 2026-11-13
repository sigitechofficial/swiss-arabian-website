"use client";

import { useToastFeed } from "@/components/ui/Toaster";
import { Toast } from "../../ui";

/** v9 `.toast` for every shared `toast()` call (the default Toaster hides while this is mounted). */
export function SapilToastHost() {
  const feed = useToastFeed();
  return <Toast open={feed.open} message={feed.message} />;
}
