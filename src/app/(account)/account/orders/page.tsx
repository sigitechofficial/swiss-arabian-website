"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { AuthGuard } from "@/components/guards/AuthGuard";

export default function AccountOrdersPage() {
  return (
    <AuthGuard requireAuth>
      <Box sx={{ maxWidth: 800, mx: "auto", px: 3, py: 6 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          Orders
        </Typography>
        <Typography color="text.secondary">
          Order history will load from `/store/orders` once the API is connected.
        </Typography>
      </Box>
    </AuthGuard>
  );
}
