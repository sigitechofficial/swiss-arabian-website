"use client";

import Link from "next/link";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { semanticColors, radius } from "@/theme/designTokens";
import { LANDING_PAGE_CARDS, type LandingPageCard } from "../constants";

function NavbarPreview({ variant }: { variant: LandingPageCard["variant"] }) {
  const bar = {
    height: 10,
    borderRadius: 99,
    bgcolor: "rgba(44, 36, 29, 0.12)",
  };

  return (
    <Box
      sx={{
        position: "relative",
        height: 118,
        px: 2,
        py: 1.75,
        background:
          "linear-gradient(180deg, #ffffff 0%, #f6efe3 100%)",
        borderBottom: "1px solid",
        borderColor: semanticColors.border.default,
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "center", mb: 1.25 }}>
        <Box
          sx={{
            width: variant === "minimal" ? "70%" : "42%",
            height: 4,
            borderRadius: 99,
            bgcolor: variant === "minimal" ? "#3a241c" : "#c4b49a",
          }}
        />
      </Box>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns:
            variant === "inline"
              ? "18px 28px 1fr 40px"
              : variant === "split"
                ? "28px 1fr 40px"
                : variant === "underline"
                  ? "36px 1fr 40px"
                  : "40px 1fr 40px",
          alignItems: "center",
          gap: 1,
          minHeight: 36,
        }}
      >
        {variant === "underline" ? (
          <Box
            sx={{
              width: 36,
              height: 10,
              justifySelf: "start",
              borderBottom: "1px solid #c4b49a",
              bgcolor: "transparent",
              borderRadius: 0,
            }}
          />
        ) : variant === "classic" || variant === "inline" || variant === "split" ? (
          <Box
            component="img"
            src="/assets/sa-logo-clear.png"
            alt=""
            sx={{ height: 22, width: "auto", justifySelf: "start" }}
          />
        ) : (
          <Box sx={{ ...bar, width: 18, justifySelf: "start" }} />
        )}
        {variant === "inline" || variant === "inline-locale" ? (
          <Box sx={{ display: "flex", gap: 0.6, justifyContent: "center" }}>
            {[1, 2, 3, 4].map((n) => (
              <Box key={n} sx={{ ...bar, width: 16 }} />
            ))}
          </Box>
        ) : variant === "split" ? (
          <Box
            sx={{
              width: "72%",
              height: 14,
              justifySelf: "center",
              border: 0,
              borderBottom: "1px solid",
              borderColor: semanticColors.border.strong,
              bgcolor: "transparent",
              borderRadius: 0,
            }}
          />
        ) : variant === "classic" ? (
          <Box sx={{ display: "flex", gap: 0.6, justifyContent: "center" }}>
            {[1, 2, 3].map((n) => (
              <Box key={n} sx={{ ...bar, width: 14 }} />
            ))}
          </Box>
        ) : (
          <Box
            component="img"
            src="/assets/sa-logo-clear.png"
            alt=""
            sx={{ height: 26, width: "auto", justifySelf: "center" }}
          />
        )}
        <Box sx={{ display: "flex", gap: 0.5, justifySelf: "end" }}>
          <Box sx={{ ...bar, width: 10 }} />
          <Box sx={{ ...bar, width: 10 }} />
        </Box>
      </Box>
      {variant === "inline" ? null : (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            gap: 0.7,
            mt: 1.25,
            pt: variant === "underline" ? 1 : 0.5,
            borderTop: variant === "underline" ? "2px solid #B46E57" : "1px solid transparent",
          }}
        >
          {[1, 2, 3, 4, 5].map((n) => (
            <Box
              key={n}
              sx={{
                ...bar,
                width: n === 1 && variant === "underline" ? 22 : 14,
                bgcolor: n === 1 && variant === "underline" ? "#B46E57" : "rgba(44, 36, 29, 0.14)",
              }}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}

export function LandingPagesIndexView() {
  return (
    <Box
      sx={{
        minHeight: "100dvh",
        bgcolor: "var(--cream, #faf6ee)",
        color: semanticColors.text.primary,
        px: { xs: 2, sm: 4 },
        py: { xs: 5, sm: 8 },
      }}
    >
      <Box sx={{ maxWidth: 1080, mx: "auto" }}>
        <Box sx={{ textAlign: "center", mb: 5 }}>
          <Box
            component="img"
            src="/assets/sa-logo-clear.png"
            alt="Swiss Arabian"
            sx={{ display: "block", height: 44, width: "auto", mx: "auto", mb: 2.5 }}
          />
          <Typography
            component="h1"
            sx={{
              fontFamily: "var(--font-display)",
              fontSize: { xs: "1.85rem", sm: "2.4rem" },
              fontWeight: 400,
              letterSpacing: "-0.02em",
              mb: 1,
            }}
          >
            Landing pages
          </Typography>
          <Typography sx={{ color: semanticColors.text.secondary, mx: "auto", maxWidth: 520 }}>
            Same homepage, six navbar treatments. Each card notes logo placement and whether we use the
            full lockup, drop SINCE 1974, or text only.
          </Typography>
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, minmax(0, 1fr))",
              md: "repeat(3, minmax(0, 1fr))",
            },
            gap: 2.25,
          }}
        >
          {LANDING_PAGE_CARDS.map((card) => (
            <Box
              key={card.id}
              component={Link}
              href={card.href}
              sx={{
                textDecoration: "none",
                color: "inherit",
                display: "flex",
                flexDirection: "column",
                height: "100%",
                overflow: "hidden",
                bgcolor: semanticColors.bg.paper,
                border: "1px solid",
                borderColor: semanticColors.border.default,
                borderRadius: `${radius.md}px`,
                boxShadow: "none",
                transition: "border-color 180ms ease, transform 180ms ease",
                "&:hover": {
                  borderColor: semanticColors.action.primary,
                  transform: "translateY(-2px)",
                  "& .lp-card-open": {
                    color: semanticColors.action.primary,
                  },
                },
              }}
            >
              <NavbarPreview variant={card.variant} />
              <Box sx={{ p: 2.5, display: "flex", flexDirection: "column", flex: 1 }}>
                <Typography
                  sx={{
                    fontSize: "0.68rem",
                    fontWeight: 600,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: semanticColors.action.primary,
                    mb: 0.75,
                  }}
                >
                  Homepage 0{card.id}
                </Typography>
                <Typography
                  sx={{
                    fontFamily: "var(--font-display)",
                    fontSize: "1.25rem",
                    fontWeight: 400,
                    letterSpacing: "-0.015em",
                    mb: 0.75,
                  }}
                >
                  {card.title}
                </Typography>
                <Typography sx={{ color: semanticColors.text.secondary, fontSize: "0.9rem", mb: 1.25 }}>
                  {card.description}
                </Typography>
                <Typography
                  sx={{
                    fontSize: "0.78rem",
                    lineHeight: 1.5,
                    color: semanticColors.text.primary,
                    mb: 2,
                    flex: 1,
                    pt: 1.25,
                    borderTop: "1px solid",
                    borderColor: semanticColors.border.default,
                  }}
                >
                  {card.logoUsage}
                </Typography>
                <Typography
                  className="lp-card-open"
                  sx={{
                    fontSize: "0.72rem",
                    fontWeight: 600,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: semanticColors.text.secondary,
                  }}
                >
                  Open preview →
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
