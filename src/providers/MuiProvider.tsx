"use client";

import { CssBaseline, ThemeProvider as MuiThemeProvider } from "@mui/material";
import { useMemo, type ReactNode } from "react";
import { createMuiTheme } from "@/theme/muiTheme";
import { useColorMode } from "./ThemeProvider";

export function MuiProvider({ children }: { children: ReactNode }) {
  const { mode } = useColorMode();
  const theme = useMemo(() => createMuiTheme(mode), [mode]);

  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  );
}
