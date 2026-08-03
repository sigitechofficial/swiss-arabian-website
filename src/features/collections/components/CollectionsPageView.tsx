"use client";

import Link from "next/link";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { AppButton, AppCard } from "@/components/ui";
import { brandColors, semanticColors } from "@/theme/designTokens";

const COLLECTIONS = [
  {
    slug: "oud-essentials",
    title: "Oud Essentials",
    description: "Signature oud compositions for collectors and everyday wear.",
  },
  {
    slug: "modern-musk",
    title: "Modern Musk",
    description: "Clean, luminous musks with a contemporary finish.",
  },
  {
    slug: "gift-edit",
    title: "Gift Edit",
    description: "Curated sets ready for celebrations and hospitality.",
  },
];

export function CollectionsPageView() {
  return (
    <Box sx={{ maxWidth: 1280, mx: "auto", px: { xs: 2, md: 4 }, py: { xs: 4, md: 6 } }}>
      <Typography
        variant="h3"
        sx={{
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          mb: 1,
          fontSize: { xs: "1.75rem", md: "2.25rem" },
        }}
      >
        Collections
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 4, maxWidth: 480 }}>
        Explore curated fragrance worlds from Swiss Arabian.
      </Typography>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr" },
          gap: 3,
        }}
      >
        {COLLECTIONS.map((collection) => (
          <AppCard key={collection.slug} noPadding>
            <Box
              sx={{
                height: 160,
                bgcolor: brandColors.paper,
                borderBottom: "1px solid",
                borderColor: semanticColors.border.default,
              }}
            />
            <Box sx={{ p: 2.5 }}>
              <Typography sx={{ fontWeight: 700, mb: 1 }}>{collection.title}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {collection.description}
              </Typography>
              <AppButton
                component={Link}
                href={`/collections/${collection.slug}`}
                dsVariant="secondary"
                dsSize="sm"
              >
                Explore
              </AppButton>
            </Box>
          </AppCard>
        ))}
      </Box>
    </Box>
  );
}
