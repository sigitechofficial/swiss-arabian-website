"use client";

import Link from "next/link";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { APP_NAME } from "@/lib/constants";
import { footerNav } from "@/lib/navigation/storeNavigation";
import { brandColors, semanticColors } from "@/theme/designTokens";

export function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        mt: "auto",
        borderTop: "1px solid",
        borderColor: semanticColors.border.default,
        bgcolor: brandColors.paper,
      }}
    >
      <Box
        sx={{
          maxWidth: 1280,
          mx: "auto",
          px: { xs: 2, md: 4 },
          py: { xs: 6, md: 8 },
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "2fr 1fr 1fr" },
          gap: 4,
        }}
      >
        <Box>
          <Typography
            sx={{
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: "1.5rem",
              color: brandColors.ink,
              mb: 1,
            }}
          >
            {APP_NAME}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 360 }}>
            Fragrance crafted for every journey — oud, musk, and contemporary
            scents rooted in Arabian tradition.
          </Typography>
        </Box>

        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
            Shop
          </Typography>
          <Stack spacing={1}>
            {footerNav.shop.map((item) => (
              <Typography
                key={item.href}
                component={Link}
                href={item.href}
                variant="body2"
                sx={{
                  color: "text.secondary",
                  textDecoration: "none",
                  "&:hover": { color: brandColors.terra },
                }}
              >
                {item.label}
              </Typography>
            ))}
          </Stack>
        </Box>

        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
            Help
          </Typography>
          <Stack spacing={1}>
            {footerNav.help.map((item) => (
              <Typography
                key={item.href}
                component={Link}
                href={item.href}
                variant="body2"
                sx={{
                  color: "text.secondary",
                  textDecoration: "none",
                  "&:hover": { color: brandColors.terra },
                }}
              >
                {item.label}
              </Typography>
            ))}
          </Stack>
        </Box>
      </Box>
    </Box>
  );
}
