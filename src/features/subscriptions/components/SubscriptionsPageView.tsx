"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

export function SubscriptionsPageView() {
  return (
    <Box sx={{ maxWidth: 800, mx: "auto", px: 3, py: 8 }}>
      <Typography
        variant="h3"
        sx={{ fontFamily: "var(--font-display)", fontWeight: 700, mb: 2 }}
      >
        Subscriptions
      </Typography>
      <Typography color="text.secondary">
        Fragrance subscription plans and manage-subscription UI will connect here.
      </Typography>
    </Box>
  );
}
