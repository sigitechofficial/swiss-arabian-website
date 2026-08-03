"use client";

import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import { brandColors } from "@/theme/designTokens";

export function PageLoading({ label = "Loading…" }: { label?: string }) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
        minHeight: 240,
        py: 6,
      }}
    >
      <CircularProgress size={32} sx={{ color: brandColors.terra }} />
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
    </Box>
  );
}
