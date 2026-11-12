"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { CloseIcon, cx } from "./shared";
import { IconButton } from "./IconButton";

/* ——— focus helpers ——— */
function useReturnFocus(open: boolean) {
  const prev = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (open) {
      prev.current = document.activeElement as HTMLElement | null;
      return;
    }
    prev.current?.focus?.();
    prev.current = null;
  }, [open]);
}

export type DrawerProps = {
  open: boolean;
  onClose: () => void;
  /** heading, e.g. "Your bag" */
  title: ReactNode;
  /** item count chip after the title (`.bag-n`); its label reads "3 items" */
  count?: number;
  closeLabel?: string;
  /** free-delivery card row (`.ship`), e.g. <FreeDeliveryCard /> */
  ship?: ReactNode;
  /** totals and checkout (`.d-foot`) */
  footer?: ReactNode;
  children: ReactNode;
};

/**
 * v9 bag `.drawer` + `.scrim`: slides in from the right. A modal dialog: focus moves to the
 * close button, Escape and the scrim close it, focus returns to the opener, and it is inert
 * while closed.
 */
export function Drawer({ open, onClose, title, count, closeLabel = "Close bag", ship, footer, children }: DrawerProps) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  useReturnFocus(open);
  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <>
      <div
        aria-hidden="true"
        onClick={onClose}
        className={cx(
          "fixed inset-0 bg-[rgba(30,27,24,.35)] [transition:opacity_.25s] z-[60]",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        )}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        inert={!open}
        className={cx(
          "fixed top-0 right-0 bottom-0 w-[min(440px,100%)] bg-sapil-paper z-[61] [transition:transform_.35s_var(--sapil-ease)] flex flex-col shadow-sapil-lg",
          open ? "[transform:none]" : "[transform:translateX(100%)]",
        )}
      >
        <div className="flex justify-between items-center py-[20px] px-[24px] border-b border-transparent bg-[linear-gradient(120deg,var(--sapil-p-pink),var(--sapil-p-peach)_55%,var(--sapil-p-butter))]">
          <h2 id={titleId} className="text-[26px]">
            {title}
            {count ? (
              <span
                aria-label={`${count} item${count === 1 ? "" : "s"}`}
                className="inline-grid place-items-center min-w-[28px] h-[28px] px-[9px] ml-[6px] rounded-full bg-sapil-white font-sapil-sans text-[13px] font-[600] text-sapil-ink align-middle shadow-[0_1px_3px_rgba(60,45,30,.1)]"
              >
                {count}
              </span>
            ) : null}
          </h2>
          <IconButton ref={closeRef} label={closeLabel} onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </div>
        {ship && <div className="py-[14px] px-[24px] text-[14px] text-sapil-ink-2 border-b border-sapil-line">{ship}</div>}
        <div className="flex-1 overflow-y-auto py-[8px] px-[24px]">{children}</div>
        {footer && <div className="pt-[12px] px-[24px] pb-[14px] border-t border-sapil-line bg-sapil-card">{footer}</div>}
      </aside>
    </>
  );
}

export type DialogProps = {
  open: boolean;
  onClose: () => void;
  /** accessible name (v9 uses aria-label="Details") */
  label: string;
  /** 1440px sheet (search) instead of 960px */
  wide?: boolean;
  closeLabel?: string;
  children: ReactNode;
  className?: string;
};

/** v9 `<dialog>`: native modal (focus trap, Escape, top layer), pops in, close button top-right. */
export function Dialog({ open, onClose, label, wide, closeLabel = "Close", children, className }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      if (typeof d.showModal === "function") d.showModal();
      else d.setAttribute("open", "");
    } else if (!open && d.open) {
      if (typeof d.close === "function") d.close();
      else d.removeAttribute("open");
    }
  }, [open]);
  return (
    <dialog
      ref={ref}
      aria-label={label}
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      className={cx(
        "border-0 rounded-[24px] bg-sapil-paper text-sapil-ink p-0 max-h-[calc(100vh-48px)] shadow-sapil-lg m-auto open:animate-sapil-pop backdrop:bg-[rgba(30,27,24,.4)]",
        wide ? "w-[min(1440px,calc(100%-16px))]" : "w-[min(960px,calc(100%-32px))]",
        className,
      )}
    >
      <IconButton label={closeLabel} onClick={onClose} className="!absolute top-[14px] right-[14px] z-[2] bg-sapil-card">
        <CloseIcon />
      </IconButton>
      {children}
    </dialog>
  );
}

export type ToastProps = {
  open: boolean;
  message: ReactNode;
  /** e.g. { label: "View bag", onClick } (`.toast-act`) */
  action?: { label: string; onClick: () => void };
};

/** v9 `.toast`: ink pill at the bottom centre. Always mounted so the status region is announced. */
export function Toast({ open, message, action }: ToastProps) {
  return (
    <div
      role="status"
      className={cx(
        "fixed left-1/2 bottom-[24px] bg-sapil-ink text-sapil-white py-[12px] px-[20px] rounded-full text-[14px] font-[500] z-[80] [transition:all_.3s_var(--sapil-ease)] pointer-events-none whitespace-nowrap",
        open ? "opacity-100 [transform:translate(-50%,0)]" : "opacity-0 [transform:translate(-50%,24px)]",
      )}
    >
      {open && message}
      {open && action && (
        <button
          type="button"
          onClick={action.onClick}
          className="ml-[12px] font-[700] text-sapil-white underline underline-offset-[3px] pointer-events-auto"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

/* ——— bag drawer contents ——— */

export type FreeDeliveryCardProps = {
  /** 0–100 */
  percent: number;
  /** threshold reached: green card with a tick */
  unlocked?: boolean;
  title: ReactNode;
  detail?: ReactNode;
  /** badge text; defaults to "Free" when unlocked, else "{percent}%" */
  badge?: ReactNode;
  icon?: ReactNode;
};

const TRUCK = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2.5 6.5h11v9.5h-11zM13.5 9.5h4l3 3.2v3.3h-7" />
    <circle cx="6.5" cy="17.5" r="1.8" />
    <circle cx="16.5" cy="17.5" r="1.8" />
  </svg>
);
const TICK = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </svg>
);

/** v9 `.ship-card`: progress to free delivery (navy), green once unlocked. */
export function FreeDeliveryCard({ percent, unlocked, title, detail, badge, icon }: FreeDeliveryCardProps) {
  const p = Math.max(0, Math.min(100, Math.round(percent)));
  return (
    <div
      className={cx(
        "grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-y-[4px] gap-x-[12px] pt-[12px] px-[14px] pb-[14px] rounded-[14px] [transition:background_.4s_var(--sapil-ease)]",
        unlocked
          ? "bg-[linear-gradient(120deg,var(--sapil-ok-soft),var(--sapil-p-mint))]"
          : "bg-[linear-gradient(120deg,var(--sapil-p-sky),var(--sapil-p-lilac))]",
      )}
    >
      <span
        className={cx(
          "w-[36px] h-[36px] rounded-full grid place-items-center shadow-[0_2px_8px_-2px_rgba(22,48,92,.25)] [&_svg]:w-[19px] [&_svg]:h-[19px]",
          unlocked ? "bg-sapil-ok text-sapil-white animate-[sapil-bump_.5s_var(--sapil-ease)]" : "bg-sapil-white text-sapil-accent",
        )}
      >
        {icon ?? (unlocked ? TICK : TRUCK)}
      </span>
      <span className="leading-[1.35]">
        <b className="block text-[14px] font-[600] text-sapil-ink">{title}</b>
        {detail && <small className="block text-[12px] text-sapil-ink-2">{detail}</small>}
      </span>
      <span
        className={cx(
          "self-start py-[3px] px-[9px] rounded-full text-[12px] font-[700] tabular-nums",
          unlocked ? "bg-sapil-ok text-sapil-white" : "bg-sapil-white text-sapil-accent",
        )}
      >
        {badge ?? (unlocked ? "Free" : `${p}%`)}
      </span>
      <span
        role="progressbar"
        aria-label="Progress to free delivery"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={p}
        className="col-span-full relative h-[6px] mt-[8px] rounded-[3px] bg-[rgba(255,255,255,.75)] overflow-hidden"
      >
        <span
          style={{ width: `${p}%` }}
          className={cx(
            "absolute inset-[0_auto_0_0] rounded-[inherit] [transition:width_.6s_var(--sapil-ease)] overflow-hidden after:content-[''] after:absolute after:inset-0 after:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,.6),transparent)] after:[transform:translateX(-100%)] after:animate-sapil-ship-shine",
            unlocked
              ? "bg-[linear-gradient(90deg,var(--sapil-ok),var(--sapil-ok-2))]"
              : "bg-[linear-gradient(90deg,var(--sapil-accent),var(--sapil-accent-2))]",
          )}
        />
      </span>
    </div>
  );
}

/** v9 `.d-foot .sum` rows: Subtotal / Delivery / Total. */
export function SummaryRow({
  label,
  value,
  variant = "default",
}: {
  label: ReactNode;
  value: ReactNode;
  variant?: "default" | "save" | "total";
}) {
  return (
    <div
      className={cx(
        "flex justify-between text-[14px] leading-[1.4] mb-[3px]",
        variant === "default" && "text-sapil-ink-2",
        variant === "save" && "text-sapil-sale",
        variant === "total" && "!text-[16px] !leading-[1.3] text-sapil-ink font-[600] mt-[8px] !mb-[10px] pt-[8px] border-t border-sapil-line",
      )}
    >
      <span>{label}</span>
      <span className="tabular-nums font-[600]">{value}</span>
    </div>
  );
}
