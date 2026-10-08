"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { LocaleLink } from "@/lib/i18n/LocaleLink";
import { SideSheet } from "@/components/ui/SideSheet";
import { Minus, Plus, X } from "lucide-react";
import { formatMoney } from "@/features/home/utils/formatMoney";
import { MERCH_RAIL_SLUGS, useMerchRail } from "@/features/merchandising";
import { EmptyBagRecovery, GiftWithPurchase, PromoLinePrice, PromotionProgressRail, PromotionQuickAdd, amountPayableFrom, setBundleLineLabel, useFreeShippingBar } from "@/features/promotions";
import { EarnPreviewNote } from "@/features/loyalty/components/EarnPreviewNote";
import { LoyaltyDrawerNote } from "@/features/loyalty/components/LoyaltyDrawerNote";
import { useEarnPreview } from "@/features/loyalty/hooks/useEarnPreview";
import { useApplicablePromotions } from "@/features/promotions/hooks/useApplicablePromotions";
import { useGiftChoiceStore } from "@/features/promotions/giftChoiceStore";
import { useCartStore } from "@/stores/useCartStore";
import { useUiStore } from "@/stores/useUiStore";
import { removeItemOptimistic, setQuantityOptimistic } from "../api/optimisticCart";
import { showsDistinctSize } from "../utils/showsDistinctSize";
import { useAddToCart } from "../hooks/useAddToCart";
import {
  cartRec,
  cartRecAdd,
  cartRecCopy,
  cartRecName,
  cartRecPh,
  cartRecPrice,
  cartRecSize,
  cartRecs,
  cartRecsSwiper,
  cartRecsTitle,
  confettiCircle,
  confettiDiamond,
  confettiLayer,
  confettiPiece,
  confettiRibbon,
  drawerBody,
  drawerCheckout,
  drawerClose,
  drawerEmpty,
  drawerFoot,
  drawerHead,
  drawerItems,
  drawerLine,
  drawerLineActions,
  drawerLineBody,
  drawerLineImg,
  drawerLineMeta,
  drawerLineName,
  drawerLineNote,
  drawerLinePrice,
  drawerLineQty,
  drawerLineRemove,
  drawerLineTop,
  drawerPanel,
  drawerPanelFlash,
  drawerTotalRow,
  drawerViewLink,
} from "@/styles/cartChrome";

const CONFETTI_COLORS = ["#2f7d4a", "#3aa05a", "#c9a227", "#e0bd78", "#8c4435", "#fff", "#f4ead8"];
const CONFETTI_SHAPES = ["circle", "ribbon", "diamond"] as const;

type ConfettiPiece = {
  id: string;
  shape: (typeof CONFETTI_SHAPES)[number];
  style: Record<string, string>;
};

export function CartSideSheet() {
  const open = useUiStore((s) => s.cartOpen);
  const setCartOpen = useUiStore((s) => s.setCartOpen);
  const lines = useCartStore((s) => s.lines);
  const totals = useCartStore((s) => s.totals);
  const syncing = useCartStore((s) => s.syncing);
  const subtotal = useCartStore((s) => s.subtotal());
  const itemCount = useCartStore((s) => s.itemCount());
  const { addToCart } = useAddToCart();
  const updateLocalQuantity = useCartStore((s) => s.updateQuantity);
  const removeLocalLine = useCartStore((s) => s.removeLine);

  const [addedRecs, setAddedRecs] = useState<Set<string>>(new Set());
  const giftFlash = useGiftChoiceStore((s) => s.flashing);
  const [isPanelFlash, setIsPanelFlash] = useState(false);
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([]);
  const wasFreeRef = useRef<boolean | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const confettiLayerRef = useRef<HTMLDivElement>(null);

  const promotions = useCartStore((s) => s.promotions);
  const cartId = useCartStore((s) => s.cartId);
  const { unlocked } = useFreeShippingBar();
  const earnPreview = useEarnPreview({ cartId });
  const quotePending = syncing && totals == null;
  const currency = totals?.currency ?? "AED";
  const amountDue = quotePending
    ? null
    : (amountPayableFrom(promotions, [
        totals?.amountPayable != null ? String(totals.amountPayable) : null,
      ]) ?? subtotal);
  const celebrateFree = unlocked;

  // Fires the "you qualify for free shipping" celebration — progress-bar
  // glow + panel flash + a confetti burst from the bar's fill — the first
  // time the subtotal actually crosses the threshold (not on every render
  // while it stays above it, and not on initial mount if it's already met).
  useEffect(() => {
    const previouslyFree = wasFreeRef.current;
    wasFreeRef.current = celebrateFree;
    if (!celebrateFree || previouslyFree !== false) return;

    setIsPanelFlash(false);
    const restart = requestAnimationFrame(() => {
      setIsPanelFlash(true);
    });

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let clearConfetti: ReturnType<typeof setTimeout> | undefined;
    if (!reduce) {
      const bar =
        panelRef.current?.querySelector("[data-ship-track]") ?? panelRef.current;
      const layer = confettiLayerRef.current;
      let ox = 78;
      let oy = 22;
      if (bar && layer) {
        const br = bar.getBoundingClientRect();
        const lr = layer.getBoundingClientRect();
        if (br.width && lr.width) {
          ox = br.left - lr.left + br.width * 0.82;
          oy = br.top - lr.top + br.height * 0.72;
        }
      }
      const n = 58 + Math.floor(Math.random() * 19);
      const pieces: ConfettiPiece[] = [];
      for (let i = 0; i < n; i++) {
        const shape = CONFETTI_SHAPES[i % 3];
        const size = 6 + Math.random() * 8;
        const rain = i % 4 === 0;
        const angle = -Math.PI * 0.08 - Math.random() * Math.PI * 0.92;
        const dist = rain ? 90 + Math.random() * 170 : 48 + Math.random() * 190;
        const dx = Math.cos(angle) * dist + (Math.random() * 36 - 18);
        const dy = Math.sin(angle) * dist + (rain ? 130 : 36);
        pieces.push({
          id: `${Date.now()}-${i}`,
          shape,
          style: {
            "--x": rain ? `${6 + Math.random() * 88}%` : `${ox}px`,
            "--y": rain ? `${3 + Math.random() * 12}%` : `${oy}px`,
            "--w": `${shape === "ribbon" ? size * 0.42 : size}px`,
            "--h": `${shape === "ribbon" ? size * 1.4 : size}px`,
            "--c": CONFETTI_COLORS[i % CONFETTI_COLORS.length],
            "--dx": `${dx}px`,
            "--dy": `${dy}px`,
            "--r0": `${Math.random() * 90 - 45}deg`,
            "--r1": `${140 + Math.random() * 300}deg`,
            "--d": `${Math.floor(i * 11)}ms`,
          },
        });
      }
      setConfetti(pieces);
      clearConfetti = setTimeout(() => setConfetti([]), 2100);
    }

    const clearFlash = setTimeout(() => setIsPanelFlash(false), 700);
    return () => {
      cancelAnimationFrame(restart);
      clearTimeout(clearFlash);
      if (clearConfetti) clearTimeout(clearConfetti);
    };
  }, [celebrateFree]);

  const recs = useMerchRail(MERCH_RAIL_SLUGS.cartLayer).slice(0, 6);
  const promotionRecs = useApplicablePromotions().data?.recommendations?.products ?? [];

  return (
    <SideSheet
      open={open}
      onClose={() => setCartOpen(false)}
      label="Bag"
      className="w-full bg-transparent shadow-[-12px_0_48px_rgba(0,0,0,0.12)] sm:w-[420px]"
    >
      <div className={`${drawerPanel} ${isPanelFlash || giftFlash ? drawerPanelFlash : ""}`} ref={panelRef}>
        <div className={confettiLayer} ref={confettiLayerRef} aria-hidden="true">
          {confetti.map((piece) => (
            <span
              key={piece.id}
              className={`${confettiPiece} ${piece.shape === "circle" ? confettiCircle : piece.shape === "ribbon" ? confettiRibbon : confettiDiamond}`}
              style={piece.style as CSSProperties}
            />
          ))}
        </div>

        <header className={drawerHead}>
          <h2>{itemCount > 0 ? `My Bag (${itemCount})` : "My Bag"}</h2>
          <button
            type="button"
            className={drawerClose}
            onClick={() => setCartOpen(false)}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </header>

        <div className={drawerBody}>
          {lines.length > 0 ? (
            <div className="grid gap-3">
              <PromotionProgressRail surface="drawer" />
              <PromotionQuickAdd surface="cart" />
            </div>
          ) : (
            <div className={drawerEmpty}>
              <p>Your bag is empty.</p>
              <EmptyBagRecovery surface="empty-cart" />
              <LocaleLink href="/products" onClick={() => setCartOpen(false)}>
                Shop fragrances
              </LocaleLink>
            </div>
          )}
          <div className={drawerItems}>
            {lines.length === 0 ? null : (
              lines.map((line) => (
                <article className={drawerLine} key={line.cartItemId ?? line.variantId}>
                  <div className={drawerLineImg}>
                    {line.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={line.imageUrl} alt="" />
                    ) : null}
                  </div>
                  <div className={drawerLineBody}>
                    <div className={drawerLineTop}>
                      <p className={drawerLineName}>{line.title}</p>
                      <PromoLinePrice className={drawerLinePrice} snapshot={promotions} line={line} />
                    </div>
                    {showsDistinctSize(line.title, line.sizeLabel) ? (
                      <p className={drawerLineMeta}>{line.sizeLabel}</p>
                    ) : null}
                    {setBundleLineLabel(promotions, line) ? (
                      <p className={drawerLineNote}>{setBundleLineLabel(promotions, line)}</p>
                    ) : null}
                    <div className={drawerLineActions}>
                      <div className={drawerLineQty}>
                        <button
                          type="button"
                          onClick={() => {
                            const next = Math.max(1, line.quantity - 1);
                            if (line.remote || line.cartItemId) {
                              setQuantityOptimistic(line.variantId, next);
                            } else {
                              updateLocalQuantity(line.variantId, next);
                            }
                          }}
                          aria-label="Decrease quantity"
                        >
                          <Minus size={13} />
                        </button>
                        <span>{line.quantity}</span>
                        <button
                          type="button"
                          onClick={() => {
                            if (line.remote || line.cartItemId) {
                              setQuantityOptimistic(line.variantId, line.quantity + 1);
                            } else {
                              updateLocalQuantity(line.variantId, line.quantity + 1);
                            }
                          }}
                          aria-label="Increase quantity"
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                      <button
                        type="button"
                        className={drawerLineRemove}
                        onClick={() => {
                          if (line.remote || line.cartItemId) {
                            removeItemOptimistic(line.variantId);
                          } else {
                            removeLocalLine(line.variantId);
                          }
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </article>
              ))
            )}
            {lines.length > 0 ? <GiftWithPurchase currency={currency} /> : null}
          </div>

          {lines.length > 0 && promotionRecs.length === 0 && recs.length ? (
            <div className={cartRecs}>
              <h3 className={cartRecsTitle}>Layer your scents</h3>
              <div className={cartRecsSwiper} role="list">
                {recs.map((product) => {
                  const canAdd = Boolean(product.variantId || product.sku);
                  const pressed = addedRecs.has(product.id);
                  return (
                    <article className={cartRec} key={product.id} role="listitem">
                      {product.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={product.imageUrl} alt="" />
                      ) : (
                        <span className={cartRecPh} aria-hidden="true" />
                      )}
                      <div className={cartRecCopy}>
                        <p className={cartRecName}>{product.title}</p>
                        <p className={cartRecPrice}>{formatMoney(product.price, product.currency)}</p>
                        <p className={cartRecSize}>50 ml</p>
                      </div>
                      <button
                        type="button"
                        className={cartRecAdd}
                        disabled={!canAdd}
                        aria-label={pressed ? `${product.title} added` : `Add ${product.title}`}
                        aria-pressed={pressed}
                        onClick={() => {
                          if (!canAdd) return;
                          void addToCart({
                            sku: product.sku,
                            variantId: product.variantId,
                            slug: product.slug,
                            title: product.title,
                            imageUrl: product.imageUrl,
                            price: product.price,
                            currency: product.currency,
                            quantity: 1,
                          });
                          setAddedRecs((prev) => new Set(prev).add(product.id));
                        }}
                      >
                        {pressed ? (
                          <span aria-hidden="true">✓</span>
                        ) : (
                          <Plus size={14} strokeWidth={1.6} />
                        )}
                      </button>
                    </article>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>

        <footer className={drawerFoot}>
          <div className={drawerTotalRow}>
            <span>Total</span>
            <strong>{amountDue == null ? "Updating…" : formatMoney(amountDue, currency)}</strong>
          </div>
          {quotePending ? null : <LoyaltyDrawerNote />}
          {quotePending ? null : <EarnPreviewNote preview={earnPreview.preview} />}
          {/* Checkout reads the server cart, so hold it for the second or two
              a background sync is still writing the latest bag changes. */}
          <LocaleLink
            className={drawerCheckout}
            href="/checkout"
            aria-disabled={lines.length === 0 || syncing}
            onClick={(event) => {
              if (lines.length === 0 || syncing) {
                event.preventDefault();
                return;
              }
              setCartOpen(false);
            }}
          >
            {syncing ? "Updating bag…" : "Checkout"}
          </LocaleLink>
          <LocaleLink className={drawerViewLink} href="/cart" onClick={() => setCartOpen(false)}>
            View bag
          </LocaleLink>
        </footer>
      </div>
    </SideSheet>
  );
}
