"use client";

import Link from "next/link";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { AuthGuard } from "@/components/guards/AuthGuard";
import { AppButton, AppCard } from "@/components/ui";
import { accountNav } from "@/lib/navigation/storeNavigation";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { performLogout } from "@/features/auth";
import { useRouter } from "next/navigation";
import { brandColors } from "@/theme/designTokens";

function AccountContent() {
  const user = useCurrentUser();
  const router = useRouter();

  return (
    <Box sx={{ maxWidth: 960, mx: "auto", px: { xs: 2, md: 4 }, py: { xs: 4, md: 6 } }}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        sx={{
          justifyContent: "space-between",
          alignItems: { md: "center" },
          mb: 3,
        }}
      >
        <Box>
          <Typography
            variant="h3"
            sx={{
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: { xs: "1.75rem", md: "2rem" },
            }}
          >
            Account
          </Typography>
          <Typography sx={{ color: "text.secondary" }}>
            {user?.email ?? "Signed in"}
          </Typography>
        </Box>
        <AppButton
          dsVariant="secondary"
          onClick={async () => {
            await performLogout();
            router.push("/");
          }}
        >
          Sign out
        </AppButton>
      </Stack>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
          gap: 2,
        }}
      >
        {accountNav.map((item) => (
          <AppCard key={item.href}>
            <Typography sx={{ fontWeight: 700, mb: 1 }}>{item.label}</Typography>
            <AppButton
              component={Link}
              href={item.href}
              dsVariant="subtle"
              dsSize="sm"
              sx={{ color: brandColors.terra }}
            >
              Open
            </AppButton>
          </AppCard>
        ))}
      </Box>
    </Box>
  );
}

export function AccountPageView() {
  return (
    <AuthGuard requireAuth>
      <AccountContent />
    </AuthGuard>
  );
}
