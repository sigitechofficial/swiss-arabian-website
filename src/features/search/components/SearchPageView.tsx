"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { AppCard, AppTextField, AppButton } from "@/components/ui";
import Stack from "@mui/material/Stack";

export function SearchPageView() {
  return (
    <Box sx={{ maxWidth: 720, mx: "auto", px: 3, py: 6 }}>
      <Typography
        variant="h3"
        sx={{
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          mb: 3,
          fontSize: { xs: "1.75rem", md: "2rem" },
        }}
      >
        Search
      </Typography>
      <AppCard>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
          <AppTextField label="Search fragrances" placeholder="Oud, musk, gift…" />
          <AppButton dsVariant="primary">Search</AppButton>
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Wire `/store/search` when OpenAPI types are available.
        </Typography>
      </AppCard>
    </Box>
  );
}
