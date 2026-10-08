"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

import {
  filterGroups,
  QUEUE_CAPACITY,
  type QueueProduct,
  queueCatalog,
} from "@/features/subscriptions/data/subscriptionContent";

type FragrancePickerSectionProps = {
  queue: Array<QueueProduct | null>;
  onAdd: (product: QueueProduct) => void;
  onRemoveById: (productId: string) => void;
};

/** Figma · catalog picker 336:3 */
export function FragrancePickerSection({
  queue,
  onAdd,
  onRemoveById,
}: FragrancePickerSectionProps) {
  const [query, setQuery] = useState("");
  const [openFilters, setOpenFilters] = useState<Record<string, boolean>>({
    brands: true,
    types: false,
  });
  const [visibleCount, setVisibleCount] = useState(8);

  const filled = queue.filter(Boolean).length;
  const queuedIds = useMemo(
    () => new Set(queue.filter(Boolean).map((p) => p!.id)),
    [queue],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return queueCatalog;
    return queueCatalog.filter((p) => p.name.toLowerCase().includes(q));
  }, [query]);

  const visible = filtered.slice(0, visibleCount);

  return (
    <section
      className="mx-auto mt-14 max-w-[1200px] border border-sa-border bg-surface px-4 py-6 sm:px-6"
      aria-label="Choose your fragrances"
    >
      <label className="relative block">
        <span className="sr-only">Search fragrances</span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search fragrances…"
          className="w-full border border-sa-input bg-page px-4 py-2.5 text-[13px] text-sa-primary outline-none placeholder:text-sa-muted focus:border-terra"
        />
      </label>

      <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:gap-6">
        <aside className="w-full shrink-0 lg:w-[260px]">
          <div className="mb-4 flex items-center justify-between gap-3 border border-sa-border px-3 py-3">
            <p className="max-w-[10rem] text-[12px] font-bold uppercase leading-tight tracking-[0.08em] text-sa-primary">
              Choose your favorite {QUEUE_CAPACITY}
            </p>
            <span
              className="flex size-14 shrink-0 items-center justify-center border border-gold text-[18px] font-semibold text-gold"
              aria-live="polite"
            >
              {filled}/{QUEUE_CAPACITY}
            </span>
          </div>

          <div className="flex flex-col gap-2">
            {filterGroups.map((group) => {
              const open = Boolean(openFilters[group.id]);
              return (
                <div
                  key={group.id}
                  className="border border-sa-border bg-surface"
                >
                  <button
                    type="button"
                    className="flex w-full items-center justify-between px-3.5 py-3 text-left text-[13px] font-bold text-sa-primary"
                    aria-expanded={open}
                    onClick={() =>
                      setOpenFilters((prev) => ({
                        ...prev,
                        [group.id]: !prev[group.id],
                      }))
                    }
                  >
                    {group.label}
                    <span className="text-terra" aria-hidden>
                      {open ? "−" : "+"}
                    </span>
                  </button>
                  {open && group.options.length > 0 ? (
                    <ul className="space-y-2 border-t border-sa-border px-3.5 pb-3.5 pt-2">
                      {group.options.map((opt) => (
                        <li key={opt}>
                          <label className="flex cursor-pointer items-center gap-2 text-[12.5px] text-sa-secondary">
                            <input
                              type="checkbox"
                              className="size-3.5 accent-[var(--color-terra)]"
                            />
                            {opt}
                          </label>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              );
            })}
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="mb-3 border border-sa-border bg-section-soft px-4 py-3">
            <p className="text-[13px] text-sa-secondary">
              {filled} of {QUEUE_CAPACITY} fragrances added to your queue
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {visible.map((product) => {
              const added = queuedIds.has(product.id);
              return (
                <article
                  key={product.id}
                  className="flex flex-col border border-sa-border bg-surface"
                >
                  <div className="sa-card-media relative flex h-[170px] items-center justify-center overflow-hidden">
                    <Image
                      src={product.image}
                      alt={product.name}
                      width={160}
                      height={160}
                      className="max-h-full w-auto object-contain p-4"
                    />
                  </div>
                  <div className="flex flex-1 flex-col gap-1.5 px-3.5 pb-3.5 pt-3">
                    <h3 className="min-h-[42px] text-[14px] font-medium leading-snug text-sa-primary">
                      {product.name}
                    </h3>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-sa-secondary">
                      {product.reviews} reviews
                    </p>
                    <button
                      type="button"
                      disabled={!added && filled >= QUEUE_CAPACITY}
                      onClick={() =>
                        added ? onRemoveById(product.id) : onAdd(product)
                      }
                      className={`mt-1 flex h-10 w-full items-center justify-center text-[11.5px] font-semibold uppercase tracking-[0.1em] transition-colors ${
                        added
                          ? "bg-terra text-white"
                          : "border border-terra text-terra hover:bg-terra hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                      }`}
                    >
                      {added ? "Added" : "Add to queue"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>

          {visibleCount < filtered.length ? (
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={() => setVisibleCount((n) => n + 8)}
                className="border border-sa-border px-8 py-2.5 text-[12px] font-semibold uppercase tracking-[0.1em] text-sa-primary hover:border-terra hover:text-terra"
              >
                Load more
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
