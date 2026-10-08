"use client";

import Image from "next/image";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { formatMoney } from "@/features/home/data/homeContent";
import type { CartLine } from "@/stores/useCartStore";

type CartLineItemProps = {
  line: CartLine;
  onUpdateQuantity: (variantId: string, quantity: number) => void;
  onRemove: (variantId: string) => void;
};

/**
 * Enterprise cart line — product meta, qty + line total paired, icon remove.
 */
export function CartLineItem({
  line,
  onUpdateQuantity,
  onRemove,
}: CartLineItemProps) {
  const lineTotal = line.unitPrice * line.quantity;
  const notes =
    line.notes && line.notes.length > 0
      ? line.notes.slice(0, 3).join(" · ")
      : null;
  const href = line.slug ? `/products/${line.slug}` : undefined;

  return (
    <article className="flex gap-4 sm:gap-5">
      <div className="relative size-[84px] shrink-0 overflow-hidden sm:size-[96px]">
        {line.imageUrl ? (
          <Image
            src={line.imageUrl}
            alt=""
            fill
            className="object-contain"
            sizes="96px"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-section-soft px-2 text-center text-[10px] font-semibold uppercase tracking-[0.12em] text-sa-muted">
            No image
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            {href ? (
              <Link
                href={href}
                className="block truncate font-sans text-[15px] font-semibold leading-snug tracking-[-0.01em] text-sa-primary transition-opacity hover:opacity-70"
              >
                {line.title}
              </Link>
            ) : (
              <p className="truncate font-sans text-[15px] font-semibold leading-snug tracking-[-0.01em] text-sa-primary">
                {line.title}
              </p>
            )}
            <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px] text-sa-muted">
              {line.sizeLabel ? <span>{line.sizeLabel}</span> : null}
              {line.sizeLabel && notes ? (
                <span className="text-sa-border" aria-hidden>
                  ·
                </span>
              ) : null}
              {notes ? (
                <span className="truncate text-[10.5px] font-semibold uppercase tracking-[0.1em]">
                  {notes}
                </span>
              ) : null}
            </div>
          </div>

          <button
            type="button"
            onClick={() => onRemove(line.variantId)}
            className="flex size-8 shrink-0 items-center justify-center text-sa-muted transition-colors hover:text-terra"
            aria-label={`Remove ${line.title}`}
          >
            <Trash2 size={16} strokeWidth={1.75} />
          </button>
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 pt-4">
          <div
            className="inline-flex h-9 items-stretch border border-sa-border bg-page"
            role="group"
            aria-label={`Quantity for ${line.title}`}
          >
            <button
              type="button"
              className="flex w-9 items-center justify-center text-[15px] leading-none text-sa-muted transition-colors hover:bg-section-soft hover:text-sa-primary"
              aria-label="Decrease quantity"
              onClick={() =>
                onUpdateQuantity(line.variantId, line.quantity - 1)
              }
            >
              −
            </button>
            <span className="flex min-w-8 items-center justify-center text-[13px] font-semibold tabular-nums text-sa-primary">
              {line.quantity}
            </span>
            <button
              type="button"
              className="flex w-9 items-center justify-center text-[15px] leading-none text-sa-muted transition-colors hover:bg-section-soft hover:text-sa-primary"
              aria-label="Increase quantity"
              onClick={() =>
                onUpdateQuantity(line.variantId, line.quantity + 1)
              }
            >
              +
            </button>
          </div>

          <div className="text-right leading-tight">
            <p className="font-sans text-[15px] font-bold tabular-nums tracking-tight text-sa-primary">
              {formatMoney(lineTotal, line.currency)}
            </p>
            {line.quantity > 1 ? (
              <p className="mt-0.5 text-[11px] tabular-nums text-sa-muted">
                {formatMoney(line.unitPrice, line.currency)} each
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}
