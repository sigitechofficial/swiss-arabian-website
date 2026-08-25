/**
 * Swiss Arabian storefront design tokens.
 */

export const primitiveColors = {
  gray0: "#FFFFFF",
  gray50: "#FAFAF9",
  gray100: "#F5F3F0",
  gray200: "#E8E4DE",
  gray300: "#D4CEC4",
  gray400: "#A89F93",
  gray500: "#7A7268",
  gray600: "#5C554C",
  gray700: "#3F3A34",
  gray800: "#2A2621",
  gray900: "#1A1714",
  gray950: "#0F0D0B",
} as const;

export const brandColors = {
  ink: "#2C241D",
  cream: "#FBF7F0",
  paper: "#F6F0E6",
  terra: "#B46E57",
  terraHover: "#A25E48",
  gold: "#B5883E",
  goldLight: "#CDA766",
  sand: "#E8DFD0",
} as const;

export const darkColors = {
  bg: "#1B1512",
  surface: "#332A22",
  elevated: "#2A221C",
  border: "#453A30",
  text: "#F6F0E6",
  textMuted: "#B8A896",
} as const;

export const lightSemanticColors = {
  bg: {
    default: "#FFFFFF",
    paper: "#FFFFFF",
    muted: brandColors.paper,
    inverse: brandColors.ink,
  },
  text: {
    primary: brandColors.ink,
    secondary: primitiveColors.gray600,
    muted: primitiveColors.gray500,
    inverse: brandColors.cream,
    link: brandColors.terra,
  },
  border: {
    default: primitiveColors.gray200,
    strong: primitiveColors.gray300,
    focus: brandColors.terra,
  },
  action: {
    primary: brandColors.terra,
    primaryHover: brandColors.terraHover,
    danger: "#C0392B",
    success: "#2E7D4F",
    warning: brandColors.gold,
  },
} as const;

export const cssVarTokens = {
  bg: {
    default: "var(--sa-bg-default)",
    paper: "var(--sa-bg-paper)",
    muted: "var(--sa-bg-muted)",
    inverse: "var(--sa-bg-inverse)",
  },
  text: {
    primary: "var(--sa-text-primary)",
    secondary: "var(--sa-text-secondary)",
    muted: "var(--sa-text-muted)",
    inverse: "var(--sa-text-inverse)",
    link: "var(--sa-text-link)",
  },
  border: {
    default: "var(--sa-border-default)",
    strong: "var(--sa-border-strong)",
    focus: "var(--sa-border-focus)",
  },
  action: {
    primary: "var(--sa-action-primary)",
    primaryHover: "var(--sa-action-primary-hover)",
    danger: "var(--sa-action-danger)",
    success: "var(--sa-action-success)",
    warning: "var(--sa-action-warning)",
  },
} as const;

export const semanticColors = cssVarTokens;

export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
} as const;

export const radius = {
  none: 0,
  xs: 4,
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 9999,
} as const;

export const shadows = {
  flat: "none",
  xs: "0 1px 2px rgba(44, 36, 29, 0.06)",
  sm: "0 2px 8px rgba(44, 36, 29, 0.08)",
  md: "0 4px 16px rgba(44, 36, 29, 0.1)",
  lg: "0 8px 32px rgba(44, 36, 29, 0.12)",
  card: "none",
  chip: "0 1px 2px rgba(44, 36, 29, 0.04)",
} as const;

export const typography = {
  fontFamily: {
    sans: "var(--font-sans)",
    display: "var(--font-display)",
    nunito: "var(--font-nunito-stack)",
  },
  size: {
    display: "3.5rem",
    h1: "2.5rem",
    h2: "2rem",
    h3: "1.5rem",
    h4: "1.25rem",
    body: "1rem",
    bodySm: "0.875rem",
    label: "0.75rem",
  },
  weight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
} as const;

export const buttonSizes = {
  sm: { height: 36, px: 14, fontSize: "0.8125rem" },
  md: { height: 44, px: 20, fontSize: "0.875rem" },
  lg: { height: 52, px: 28, fontSize: "1rem" },
} as const;

export const inputSizes = {
  sm: { height: 36 },
  md: { height: 44 },
  lg: { height: 52 },
} as const;

export const badgeSizes = {
  sm: { height: 20, fontSize: "0.6875rem", px: 6 },
  md: { height: 24, fontSize: "0.75rem", px: 8 },
} as const;
