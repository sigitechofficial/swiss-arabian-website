"use client";

import CircularProgress from "@mui/material/CircularProgress";
import { brandColors } from "@/theme/designTokens";

type PageLoadingProps = {
  label?: string;
  /** Fill parent flex area and center vertically (sticky-footer layouts). */
  fill?: boolean;
};

export function PageLoading({
  label = "Loading…",
  fill = false,
}: PageLoadingProps) {
  return (
    <div
      className={
        fill
          ? "flex flex-1 flex-col items-center justify-center gap-4 px-4 py-10"
          : "flex min-h-[240px] flex-col items-center justify-center gap-4 py-12"
      }
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <CircularProgress size={32} sx={{ color: brandColors.terra }} />
      <p className="text-[14px] text-sa-muted">{label}</p>
    </div>
  );
}
