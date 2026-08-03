"use client";

import Box from "@mui/material/Box";
import { badgeSizes, brandColors, radius } from "@/theme/designTokens";

type AppBadgeProps = {
  children: React.ReactNode;
  tone?: "neutral" | "terra" | "gold" | "success" | "danger";
  size?: keyof typeof badgeSizes;
};

const tones = {
  neutral: { bg: "#F5F3F0", color: "#2C241D" },
  terra: { bg: "rgba(180,110,87,0.12)", color: brandColors.terra },
  gold: { bg: "rgba(181,136,62,0.14)", color: brandColors.gold },
  success: { bg: "rgba(46,125,79,0.12)", color: "#2E7D4F" },
  danger: { bg: "rgba(192,57,43,0.12)", color: "#C0392B" },
};

export function AppBadge({
  children,
  tone = "neutral",
  size = "md",
}: AppBadgeProps) {
  const s = badgeSizes[size];
  const t = tones[tone];

  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        height: s.height,
        px: `${s.px}px`,
        fontSize: s.fontSize,
        fontWeight: 600,
        borderRadius: `${radius.full}px`,
        bgcolor: t.bg,
        color: t.color,
      }}
    >
      {children}
    </Box>
  );
}
