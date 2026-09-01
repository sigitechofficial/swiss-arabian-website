"use client";

import Link from "next/link";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import { Minus, Plus, Trash2 } from "lucide-react";
import { AppButton, AppCard } from "@/components/ui";
import { useCartMutations } from "../hooks/useCartMutations";
import { useCartStore } from "@/stores/useCartStore";
import { brandColors } from "@/theme/designTokens";

export function CartPageView() {
  const lines = useCartStore((s) => s.lines);
  const { updateItem, removeItem } = useCartMutations();
  const subtotal = useCartStore((s) => s.subtotal());

  if (lines.length === 0) {
    return (
      <Box sx={{ maxWidth: 720, mx: "auto", px: 3, py: 10, textAlign: "center" }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          Your bag is empty
        </Typography>
        <Typography sx={{ color: "text.secondary", mb: 3 }}>
          Discover fragrances and add your favourites.
        </Typography>
        <AppButton component={Link} href="/products" dsVariant="primary">
          Continue shopping
        </AppButton>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 960, mx: "auto", px: { xs: 2, md: 4 }, py: { xs: 4, md: 6 } }}>
      <Typography
        variant="h3"
        sx={{
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          mb: 3,
          fontSize: { xs: "1.75rem", md: "2rem" },
        }}
      >
        Bag
      </Typography>

      <Stack spacing={2}>
        {lines.map((line) => (
          <AppCard key={line.variantId}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              sx={{
                justifyContent: "space-between",
                alignItems: { sm: "center" },
              }}
            >
              <Box>
                <Typography sx={{ fontWeight: 700 }}>{line.title}</Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  {line.currency} {line.unitPrice.toFixed(0)}
                </Typography>
              </Box>
              <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                <IconButton
                  aria-label="Decrease quantity"
                  onClick={() => void updateItem(line.variantId, line.quantity - 1)}
                >
                  <Minus size={16} />
                </IconButton>
                <Typography sx={{ minWidth: 24, textAlign: "center" }}>
                  {line.quantity}
                </Typography>
                <IconButton
                  aria-label="Increase quantity"
                  onClick={() => void updateItem(line.variantId, line.quantity + 1)}
                >
                  <Plus size={16} />
                </IconButton>
                <IconButton
                  aria-label="Remove item"
                  onClick={() => void removeItem(line.variantId)}
                  sx={{ color: brandColors.terra }}
                >
                  <Trash2 size={16} />
                </IconButton>
              </Stack>
            </Stack>
          </AppCard>
        ))}
      </Stack>

      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        sx={{
          justifyContent: "space-between",
          alignItems: { sm: "center" },
          mt: 4,
        }}
      >
        <Typography sx={{ fontWeight: 700, fontSize: "1.125rem" }}>
          Subtotal: AED {subtotal.toFixed(0)}
        </Typography>
        <AppButton component={Link} href="/checkout" dsVariant="primary" dsSize="lg">
          Checkout
        </AppButton>
      </Stack>
    </Box>
  );
}
