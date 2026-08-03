"use client";

import Link from "next/link";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Menu, Search, ShoppingBag, User } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { primaryNav } from "@/lib/navigation/storeNavigation";
import { useCartStore } from "@/stores/useCartStore";
import { useUiStore } from "@/stores/useUiStore";
import { brandColors, semanticColors } from "@/theme/designTokens";
import { AppBadge } from "@/components/ui";

export function Header() {
  const setMobileNavOpen = useUiStore((s) => s.setMobileNavOpen);
  const itemCount = useCartStore((s) =>
    s.lines.reduce((sum, line) => sum + line.quantity, 0),
  );

  return (
    <Box
      component="header"
      sx={{
        position: "sticky",
        top: 0,
        zIndex: 40,
        borderBottom: "1px solid",
        borderColor: semanticColors.border.default,
        bgcolor: "rgba(251, 247, 240, 0.92)",
        backdropFilter: "blur(10px)",
      }}
    >
      <Stack
        direction="row"
        sx={{
          alignItems: "center",
          justifyContent: "space-between",
          maxWidth: 1280,
          mx: "auto",
          px: { xs: 2, md: 4 },
          py: 2,
          gap: 2,
        }}
      >
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <IconButton
            aria-label="Open menu"
            onClick={() => setMobileNavOpen(true)}
            sx={{ display: { md: "none" } }}
          >
            <Menu size={20} />
          </IconButton>
          <Typography
            component={Link}
            href="/"
            sx={{
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: { xs: "1.25rem", md: "1.5rem" },
              color: brandColors.ink,
              textDecoration: "none",
              letterSpacing: "0.02em",
            }}
          >
            {APP_NAME}
          </Typography>
        </Stack>

        <Stack
          direction="row"
          spacing={3}
          sx={{ display: { xs: "none", md: "flex" } }}
        >
          {primaryNav.map((item) => (
            <Typography
              key={item.href}
              component={Link}
              href={item.href}
              sx={{
                color: brandColors.ink,
                textDecoration: "none",
                fontSize: "0.875rem",
                fontWeight: 500,
                "&:hover": { color: brandColors.terra },
              }}
            >
              {item.label}
            </Typography>
          ))}
        </Stack>

        <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
          <IconButton component={Link} href="/search" aria-label="Search">
            <Search size={20} />
          </IconButton>
          <IconButton component={Link} href="/account" aria-label="Account">
            <User size={20} />
          </IconButton>
          <IconButton
            component={Link}
            href="/cart"
            aria-label="Cart"
            sx={{ position: "relative" }}
          >
            <ShoppingBag size={20} />
            {itemCount > 0 ? (
              <Box sx={{ position: "absolute", top: 4, right: 4 }}>
                <AppBadge tone="terra" size="sm">
                  {itemCount}
                </AppBadge>
              </Box>
            ) : null}
          </IconButton>
        </Stack>
      </Stack>
    </Box>
  );
}
