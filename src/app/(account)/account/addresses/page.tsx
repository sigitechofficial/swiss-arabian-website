"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { AuthGuard } from "@/components/guards/AuthGuard";

export default function AccountAddressesPage() {
  return (
    <AuthGuard requireAuth>
      <Box sx={{ maxWidth: 800, mx: "auto", px: 3, py: 6 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          Addresses
        </Typography>
        <Typography color="text.secondary">
          Saved shipping addresses will be managed here.
        </Typography>
      </Box>
    </AuthGuard>
  );
}
