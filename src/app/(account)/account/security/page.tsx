"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { AuthGuard } from "@/components/guards/AuthGuard";

export default function AccountSecurityPage() {
  return (
    <AuthGuard requireAuth>
      <Box sx={{ maxWidth: 800, mx: "auto", px: 3, py: 6 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          Security
        </Typography>
        <Typography color="text.secondary">
          Password and session management for your storefront account.
        </Typography>
      </Box>
    </AuthGuard>
  );
}
