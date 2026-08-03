"use client";

import Link from "next/link";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { AppButton } from "./AppButton";

export function ForbiddenView({
  title = "Access restricted",
  description = "You do not have permission to view this page.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <Box sx={{ textAlign: "center", py: 10, px: 3 }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
        {title}
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        {description}
      </Typography>
      <AppButton component={Link} href="/" dsVariant="primary">
        Back to home
      </AppButton>
    </Box>
  );
}
