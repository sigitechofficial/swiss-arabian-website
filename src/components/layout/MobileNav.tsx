"use client";

import Link from "next/link";
import Drawer from "@mui/material/Drawer";
import { X } from "lucide-react";
import { MOBILE_NAV } from "@/features/home/constants/homeAssets";
import { useNavigation } from "@/features/navigation";
import { useUiStore } from "@/stores/useUiStore";

export function MobileNav() {
  const open = useUiStore((s) => s.mobileNavOpen);
  const setMobileNavOpen = useUiStore((s) => s.setMobileNavOpen);
  const { headerItems } = useNavigation();
  const items = headerItems.length ? headerItems : MOBILE_NAV;

  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={() => setMobileNavOpen(false)}
      slotProps={{ paper: { sx: { width: "min(100%, 360px)" } } }}
    >
      <div className="flex h-full flex-col bg-page px-5 py-4">
        <div className="mb-6 flex items-center justify-between">
          <p className="font-display text-2xl text-sa-primary">Menu</p>
          <button
            type="button"
            onClick={() => setMobileNavOpen(false)}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>
        <nav className="flex flex-col gap-3">
          {items.map((item) => (
            <Link
              key={item.label}
              href={"href" in item && item.href ? item.href : "/collections"}
              className="text-lg text-sa-primary"
              onClick={() => setMobileNavOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </Drawer>
  );
}
