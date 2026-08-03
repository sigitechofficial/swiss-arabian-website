"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useParams } from "next/navigation";
import { AppButton } from "@/components/ui";
import Link from "next/link";

export function CollectionDetailPageView() {
  const params = useParams<{ slug: string }>();

  return (
    <Box sx={{ maxWidth: 800, mx: "auto", px: 3, py: 8 }}>
      <Typography
        variant="h3"
        sx={{
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          mb: 2,
          textTransform: "capitalize",
        }}
      >
        {params.slug.replace(/-/g, " ")}
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Collection products will load from the store catalog API once Swagger types
        are generated.
      </Typography>
      <AppButton component={Link} href="/products" dsVariant="primary">
        Browse all products
      </AppButton>
    </Box>
  );
}
