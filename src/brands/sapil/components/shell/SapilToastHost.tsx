"use client";

import { useToastFeed } from "@/components/ui/Toaster";
import { Toast } from "../../ui";

/** v9 `.toast` for every shared `toast()` call (the default Toaster hides while this is mounted). */
export function SapilToastHost() {
  const feed = useToastFeed();
  const action = feed.action;
  return (
    <Toast
      open={feed.open}
      message={feed.message}
      action={
        action
          ? {
              label: action.label,
              onClick: () => {
                feed.dismiss();
                action.onClick();
              },
            }
          : undefined
      }
    />
  );
}
