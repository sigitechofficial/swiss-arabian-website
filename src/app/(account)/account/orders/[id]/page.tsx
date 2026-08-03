"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useParams } from "next/navigation";
import { AuthGuard } from "@/components/guards/AuthGuard";

export default function AccountOrderDetailPage() {
  const params = useParams<{ id: string }>();

  return (
    <AuthGuard requireAuth>
      <Box sx={{ maxWidth: 800, mx: "auto", px: 3, py: 6 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          Order {params.id}
        </Typography>
        <Typography color="text.secondary">
          Order detail view placeholder.
        </Typography>
      </Box>
    </AuthGuard>
  );
}
