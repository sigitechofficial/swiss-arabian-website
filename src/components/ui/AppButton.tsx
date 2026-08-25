"use client";

import Button, { type ButtonProps } from "@mui/material/Button";
import { forwardRef } from "react";
import { brandColors, buttonSizes, radius } from "@/theme/designTokens";

export type DsVariant =
  | "primary"
  | "secondary"
  | "subtle"
  | "soft"
  | "ghost"
  | "black"
  | "ink"
  | "gold"
  | "danger"
  | "success"
  | "warning";

export type DsSize = keyof typeof buttonSizes;

const variantStyles: Record<
  DsVariant,
  { bgcolor: string; color: string; hoverBg: string; border?: string }
> = {
  primary: {
    bgcolor: brandColors.terra,
    color: "#fff",
    hoverBg: brandColors.terraHover,
  },
  secondary: {
    bgcolor: "transparent",
    color: brandColors.ink,
    hoverBg: "rgba(44,36,29,0.06)",
    border: `1px solid ${brandColors.ink}`,
  },
  subtle: {
    bgcolor: "transparent",
    color: brandColors.ink,
    hoverBg: "rgba(44,36,29,0.06)",
  },
  soft: {
    bgcolor: brandColors.paper,
    color: brandColors.ink,
    hoverBg: brandColors.sand,
  },
  ghost: {
    bgcolor: "transparent",
    color: brandColors.ink,
    hoverBg: "rgba(44,36,29,0.04)",
  },
  black: {
    bgcolor: brandColors.ink,
    color: brandColors.cream,
    hoverBg: "#1A1714",
  },
  ink: {
    bgcolor: brandColors.ink,
    color: brandColors.cream,
    hoverBg: "#1A1714",
  },
  gold: {
    bgcolor: brandColors.gold,
    color: "#fff",
    hoverBg: brandColors.goldLight,
  },
  danger: {
    bgcolor: "#C0392B",
    color: "#fff",
    hoverBg: "#A93226",
  },
  success: {
    bgcolor: "#2E7D4F",
    color: "#fff",
    hoverBg: "#256740",
  },
  warning: {
    bgcolor: brandColors.gold,
    color: "#fff",
    hoverBg: brandColors.goldLight,
  },
};

export type AppButtonProps = Omit<ButtonProps, "variant" | "size" | "color"> & {
  dsVariant?: DsVariant;
  dsSize?: DsSize;
};

export const AppButton = forwardRef<HTMLButtonElement, AppButtonProps>(
  function AppButton(
    { dsVariant = "primary", dsSize = "md", sx, children, ...props },
    ref,
  ) {
    const size = buttonSizes[dsSize];
    const styles = variantStyles[dsVariant];

    return (
      <Button
        ref={ref}
        disableElevation
        sx={{
          height: size.height,
          px: `${size.px}px`,
          fontSize: size.fontSize,
          borderRadius: `${radius.md}px`,
          bgcolor: styles.bgcolor,
          color: styles.color,
          border: styles.border ?? "1px solid transparent",
          textTransform: "none",
          fontWeight: 600,
          "&:hover": {
            bgcolor: styles.hoverBg,
          },
          ...sx,
        }}
        {...props}
      >
        {children}
      </Button>
    );
  },
);
