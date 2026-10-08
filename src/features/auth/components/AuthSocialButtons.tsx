"use client";

import Image from "next/image";
import { env } from "@/lib/config/env";
import { toast } from "@/components/ui/Toaster";
import { authAssets } from "../constants/authAssets";

const PROVIDERS = [
  { id: "google", label: "Continue with Google", icon: authAssets.google },
  { id: "apple", label: "Continue with Apple", icon: authAssets.apple },
] as const;

/** Figma social row — shown for layout fidelity; gated until OAuth is configured. */
export function AuthSocialButtons() {
  return (
    <div className="flex w-full flex-col gap-2">
      {PROVIDERS.map((provider) => (
        <button
          key={provider.id}
          type="button"
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-sa-border bg-surface py-3 text-[15px] font-medium text-sa-primary transition-colors hover:bg-section-soft"
          onClick={() => {
            if (!env.flags.oauth) {
              toast("Social sign-in is coming soon.", "error");
              return;
            }
            toast(`${provider.label} is not configured yet.`, "error");
          }}
        >
          <Image
            src={provider.icon}
            alt=""
            width={18}
            height={18}
            className="size-[18px] shrink-0"
            unoptimized
          />
          {provider.label}
        </button>
      ))}
    </div>
  );
}

export function AuthOrDivider() {
  return (
    <div className="flex w-full items-center gap-3 py-5">
      <span className="h-px flex-1 bg-sa-border" aria-hidden />
      <span className="text-[12px] font-medium uppercase tracking-[0.08em] text-sa-muted">
        Or
      </span>
      <span className="h-px flex-1 bg-sa-border" aria-hidden />
    </div>
  );
}
