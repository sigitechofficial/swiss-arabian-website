"use client";

import { useMediaQuery } from "./useMediaQuery";

export function useIsMobile(breakpoint = 900) {
  return useMediaQuery(`(max-width: ${breakpoint}px)`);
}
