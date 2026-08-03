"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import type { ReactNode } from "react";
import { getQueryClient } from "@/lib/api/queryClient";
import { env } from "@/lib/config/env";

export function QueryProvider({ children }: { children: ReactNode }) {
  const client = getQueryClient();

  return (
    <QueryClientProvider client={client}>
      {children}
      {env.isDev ? <ReactQueryDevtools initialIsOpen={false} /> : null}
    </QueryClientProvider>
  );
}
