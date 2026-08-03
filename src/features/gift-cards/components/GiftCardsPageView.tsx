"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

export function GiftCardsPageView() {
  return (
    <Box sx={{ maxWidth: 800, mx: "auto", px: 3, py: 8 }}>
      <Typography
        variant="h3"
        sx={{ fontFamily: "var(--font-display)", fontWeight: 700, mb: 2 }}
      >
        Gift Cards
      </Typography>
      <Typography color="text.secondary">
        Digital and physical gift card purchase flows will live here.
      </Typography>
    </Box>
  );
}
