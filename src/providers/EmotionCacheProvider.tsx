"use client";

import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import type { ReactNode } from "react";

export function EmotionCacheProvider({ children }: { children: ReactNode }) {
  return (
    <AppRouterCacheProvider options={{ key: "sa" }}>
      {children}
    </AppRouterCacheProvider>
  );
}
