"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";
import { radius, semanticColors } from "@/theme/designTokens";

type AppCardProps = {
  title?: string;
  subtitle?: string;
  headerAction?: ReactNode;
  noPadding?: boolean;
  children: ReactNode;
};

export function AppCard({
  title,
  subtitle,
  headerAction,
  noPadding,
  children,
}: AppCardProps) {
  return (
    <Box
      sx={{
        border: "1px solid",
        borderColor: semanticColors.border.default,
        borderRadius: `${radius.md}px`,
        boxShadow: "none",
        bgcolor: semanticColors.bg.paper,
        overflow: "hidden",
      }}
    >
      {(title || headerAction) && (
        <Stack
          direction="row"
          sx={{
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 2,
            px: 3,
            pt: 3,
            pb: title && !noPadding ? 0 : 2,
          }}
        >
          <Box>
            {title ? (
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {title}
              </Typography>
            ) : null}
            {subtitle ? (
              <Typography variant="body2" sx={{ mt: 0.5, color: "text.secondary" }}>
                {subtitle}
              </Typography>
            ) : null}
          </Box>
          {headerAction}
        </Stack>
      )}
      <Box sx={{ p: noPadding ? 0 : 3 }}>{children}</Box>
    </Box>
  );
}
