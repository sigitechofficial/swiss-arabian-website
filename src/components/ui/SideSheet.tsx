"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";

export function SideSheet({
  open,
  onClose,
  side = "right",
  className = "",
  label,
  labelledBy,
  children,
}: {
  open: boolean;
  onClose: () => void;
  side?: "left" | "right";
  className?: string;
  label?: string;
  labelledBy?: string;
  children: ReactNode;
}) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.classList.add("overflow-hidden");
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCloseRef.current();
    };
    window.addEventListener("keydown", onKey);
    panelRef.current?.querySelector<HTMLElement>("button, a[href], input")?.focus();
    return () => {
      document.body.classList.remove("overflow-hidden");
      window.removeEventListener("keydown", onKey);
      previous?.focus();
    };
  }, [open]);

  if (!open) return null;

  const enter = side === "left" ? "starting:-translate-x-full" : "starting:translate-x-full";

  return createPortal(
    <div className="fixed inset-0 z-[1300]">
      <button
        type="button"
        className="absolute inset-0 cursor-pointer border-0 bg-[rgba(24,20,17,0.4)] backdrop-blur-[6px]"
        aria-label="Close"
        onClick={() => onCloseRef.current()}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={labelledBy ? undefined : label}
        aria-labelledby={labelledBy}
        className={`absolute inset-y-0 flex translate-x-0 transition-transform duration-300 ease-out motion-reduce:transition-none ${enter} ${
          side === "left" ? "left-0" : "right-0"
        } ${className}`}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
