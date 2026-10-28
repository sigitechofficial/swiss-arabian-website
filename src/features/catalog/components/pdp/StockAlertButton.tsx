"use client";

import { FormEvent, type MouseEvent, useState } from "react";
import { createPortal } from "react-dom";
import { apiPost } from "@/lib/api/apiClient";
import { storefrontContextQuery } from "@/lib/storefront/context";
import { pdpAdd } from "@/styles/pdpChrome";
import { cardAddButton } from "@/styles/productCard";
import type { CatalogProduct } from "../constants/catalogProducts";

type StockAlertButtonProps = {
  product: Pick<CatalogProduct, "id" | "variantId" | "sku" | "title" | "slug">;
  appearance?: "pdp" | "card";
};

export function StockAlertButton({ product, appearance = "pdp" }: StockAlertButtonProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!product.sku || !product.id) {
      setError("This product cannot take an alert yet.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const query = storefrontContextQuery();
      await apiPost(
        `/storefront/catalog/stock-alerts${query ? `?${query}` : ""}`,
        {
          productId: product.id,
          variantId: product.variantId,
          sku: product.sku,
          productName: product.title,
          slug: product.slug,
          email,
        },
        { skipAuth: true },
      );
      setDone(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "We couldn't save that email.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        className={appearance === "card" ? cardAddButton : pdpAdd}
        type="button"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setOpen(true);
        }}
      >
        {appearance === "card" ? "Notify me" : "Notify me when available"}
      </button>
      {open
        ? createPortal(
        <div
          className="pointer-events-auto fixed inset-0 z-[80] grid place-items-center bg-[rgb(26_21_18/0.46)] p-4"
          role="presentation"
          onMouseDown={(event) => event.preventDefault()}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setOpen(false);
          }}
        >
          <form
            className="pointer-events-auto w-full max-w-[420px] rounded-2xl bg-white p-6 text-[#241f1b] shadow-[0_24px_80px_rgb(26_21_18/0.18)]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="stock-alert-title"
            onMouseDown={(event) => event.stopPropagation()}
            onClick={(event) => event.stopPropagation()}
            onSubmit={(event) => void submit(event)}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="stock-alert-title" className="m-0 text-[1.35rem] font-semibold tracking-[-0.02em]">
                  Email me when available
                </h2>
                <p className="mt-2 mb-0 text-[0.95rem] font-medium">{product.title}</p>
              </div>
              <button
                type="button"
                className="pointer-events-auto cursor-pointer border-0 bg-transparent p-0 text-[0.85rem] text-[#8a7d72] underline"
                onMouseDown={(event) => event.stopPropagation()}
                onClick={(event: MouseEvent<HTMLButtonElement>) => {
                  event.preventDefault();
                  event.stopPropagation();
                  setOpen(false);
                }}
              >
                Close
              </button>
            </div>
            {done ? (
              <p className="mt-6 mb-0 text-[0.95rem] leading-relaxed" role="status">
                We'll email {email.trim()} when this is available again.
              </p>
            ) : (
              <>
                <label className="mt-6 block text-[0.8rem] font-medium" htmlFor="stock-alert-email">
                  Email address
                </label>
                <input
                  id="stock-alert-email"
                  className="mt-2 h-12 w-full rounded-full border border-[#e4d8c8] px-4 text-[0.95rem] outline-none focus:border-[#241f1b]"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
                {error ? (
                  <p className="mt-3 mb-0 text-[0.85rem] text-[#8c4435]" role="alert">
                    {error}
                  </p>
                ) : null}
                <button
                  className="mt-4 h-12 w-full cursor-pointer rounded-full border-0 bg-[#241f1b] text-[0.85rem] font-semibold tracking-[0.08em] text-white uppercase disabled:opacity-60"
                  type="submit"
                  disabled={busy}
                >
                  {busy ? "Saving…" : "Notify me"}
                </button>
              </>
            )}
          </form>
        </div>,
        document.body,
      )
        : null}
    </>
  );
}
