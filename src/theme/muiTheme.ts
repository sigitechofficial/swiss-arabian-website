"use client";

import { createTheme } from "@mui/material/styles";
import {
  brandColors,
  lightSemanticColors,
  primitiveColors,
  radius,
  typography,
} from "./designTokens";

export function createMuiTheme(mode: "light" | "dark" = "light") {
  const isDark = mode === "dark";

  return createTheme({
    cssVariables: true,
    palette: {
      mode,
      primary: {
        main: brandColors.terra,
        dark: brandColors.terraHover,
        contrastText: "#FFFFFF",
      },
      secondary: {
        main: brandColors.ink,
        contrastText: brandColors.cream,
      },
      warning: {
        main: brandColors.gold,
      },
      background: {
        default: isDark ? "#1B1512" : lightSemanticColors.bg.default,
        paper: isDark ? "#332A22" : lightSemanticColors.bg.paper,
      },
      text: {
        primary: isDark ? "#F6F0E6" : lightSemanticColors.text.primary,
        secondary: isDark ? "#B8A896" : lightSemanticColors.text.secondary,
      },
      divider: isDark ? "#453A30" : primitiveColors.gray200,
    },
    typography: {
      fontFamily: typography.fontFamily.sans,
      h1: {
        fontFamily: typography.fontFamily.display,
        fontWeight: typography.weight.bold,
      },
      h2: {
        fontFamily: typography.fontFamily.display,
        fontWeight: typography.weight.bold,
      },
      h3: {
        fontFamily: typography.fontFamily.display,
        fontWeight: typography.weight.semibold,
      },
      button: {
        textTransform: "none",
        fontWeight: typography.weight.semibold,
      },
    },
    shape: {
      borderRadius: radius.md,
    },
    components: {
      MuiButton: {
        defaultProps: {
          disableElevation: true,
        },
        styleOverrides: {
          root: {
            borderRadius: radius.md,
          },
        },
      },
      MuiPaper: {
        defaultProps: {
          elevation: 0,
        },
        styleOverrides: {
          root: {
            borderRadius: radius.md,
          },
        },
      },
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: isDark
              ? "#1B1512"
              : lightSemanticColors.bg.default,
          },
        },
      },
    },
  });
}

export type AppMuiTheme = ReturnType<typeof createMuiTheme>;
