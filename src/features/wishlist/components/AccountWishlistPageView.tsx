"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PageLoading } from "@/components/ui";
import { AccountPageShell } from "@/features/account/components/AccountPageShell";
import { AccountPageTitle } from "@/features/account/components/AccountPageTitle";
import { accountContainer } from "@/features/account/constants/accountLayout";
import { CatalogEmptyState } from "@/features/catalog/components/CatalogEmptyState";
import { CatalogProductCard } from "@/features/catalog/components/catalog/CatalogProductCard";
import { CatalogPagination } from "@/features/catalog/components/CatalogPagination";
import { DEFAULT_ZONE_CODE } from "@/lib/storefront/context";
import { getUserFacingErrorMessage } from "@/lib/api/userFacingErrors";
import { useMarket } from "@/providers/MarketProvider";
import { wishlistKeys } from "../api/wishlist.keys";
import { fetchWishlist } from "../api/wishlist.service";
import { useWishlistMutations } from "../hooks/useWishlistMutations";
import {
  uniqueProductUuids,
  WISHLIST_LIST_PAGE_SIZE,
} from "../utils/productId";
import type { StorefrontWishlistStatusView } from "../types/wishlist";
import { toWishlistCatalogProduct } from "../utils/toWishlistProductCard";
import { WishlistHeartButton } from "./WishlistHeartButton";
import { wishlistBand, wishlistGrid } from "@/styles/shopChrome";

type AccountWishlistPageViewProps = {
  title: string;
};

export function AccountWishlistPageView({ title }: AccountWishlistPageViewProps) {
  const searchParams = useSearchParams();
  const { marketId } = useMarket();
  const zoneCode = marketId || DEFAULT_ZONE_CODE;
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const offset = (page - 1) * WISHLIST_LIST_PAGE_SIZE;
  const [confirmClear, setConfirmClear] = useState(false);
  const queryClient = useQueryClient();
  const { clear } = useWishlistMutations();

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: wishlistKeys.list(zoneCode, WISHLIST_LIST_PAGE_SIZE, offset),
    queryFn: () =>
      fetchWishlist({
        zoneCode,
        limit: WISHLIST_LIST_PAGE_SIZE,
        offset,
      }),
  });

  const items = data?.items;
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / WISHLIST_LIST_PAGE_SIZE));
  const listPath =
    title.toLowerCase().includes("saved") ? "/account/saved" : "/account/wishlist";

  const cards = useMemo(
    () =>
      (items ?? []).map((item) => ({
        item,
        card: item.product ? toWishlistCatalogProduct(item.product) : null,
      })),
    [items],
  );

  useEffect(() => {
    if (!items?.length) return;
    const ids = uniqueProductUuids(items.map((item) => item.productId));
    if (ids.length === 0) return;
    queryClient.setQueryData<StorefrontWishlistStatusView>(
      wishlistKeys.status(ids),
      {
        items: ids.map((productId) => ({ productId, inWishlist: true })),
      },
    );
  }, [items, queryClient]);

  return (
    <AccountPageShell>
      <AccountPageTitle
        title={title}
        subtitle={
          total > 0
            ? `${total} saved ${total === 1 ? "fragrance" : "fragrances"}`
            : "Save fragrances from the shop to find them here later."
        }
      />

      <div className={`${accountContainer} pb-16`}>
        {isLoading && !data ? (
          <PageLoading label="Loading saved items…" />
        ) : isError ? (
          <div className="rounded-lg border border-sa-border bg-section-soft px-6 py-10">
            <p className="text-[13px] text-sa-secondary">
              {getUserFacingErrorMessage(error)}
            </p>
            <button
              type="button"
              onClick={() => void refetch()}
              className="mt-4 text-[12px] font-semibold text-terra hover:underline"
            >
              Try again
            </button>
          </div>
        ) : !items?.length && total === 0 ? (
          <CatalogEmptyState
            title="No saved items yet"
            description="Tap the heart on a product to save it here. Your wishlist is available after you sign in."
          />
        ) : !items?.length ? (
          <div className="rounded-lg border border-sa-border bg-section-soft px-6 py-10">
            <p className="text-[13px] text-sa-secondary">
              Saved items on this page are hidden in the current market.
            </p>
            {totalPages > 1 ? (
              <CatalogPagination
                page={page}
                totalPages={totalPages}
                total={total}
                hrefForPage={(nextPage) =>
                  nextPage <= 1 ? listPath : `${listPath}?page=${nextPage}`
                }
              />
            ) : null}
          </div>
        ) : (
          <>
            <div className="mb-6 flex flex-wrap items-center justify-end gap-3">
              {confirmClear ? (
                <div className="flex flex-wrap items-center gap-3 text-[12px]">
                  <span className="text-sa-secondary">
                    Remove all saved items?
                  </span>
                  <button
                    type="button"
                    disabled={clear.isPending}
                    onClick={() => {
                      void clear.unwrap().finally(() => setConfirmClear(false));
                    }}
                    className="cursor-pointer font-semibold text-terra hover:underline disabled:opacity-50"
                  >
                    {clear.isPending ? "Removing…" : "Yes, clear all"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmClear(false)}
                    className="cursor-pointer font-semibold text-sa-muted hover:text-sa-primary"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmClear(true)}
                  className="cursor-pointer text-[12px] font-semibold uppercase tracking-[0.08em] text-sa-muted hover:text-terra"
                >
                  Clear all
                </button>
              )}
            </div>

            <div className={wishlistBand}>
                <ul className={wishlistGrid} role="list" aria-busy={isFetching}>
                  {cards.map(({ item, card }) => {
                    const heart = <WishlistHeartButton productId={item.productId} />;
                    if (!card) {
                      return (
                        <li
                          key={item.productId}
                          className="flex min-h-[280px] flex-col justify-between rounded-lg border border-sa-border bg-section-soft p-4"
                        >
                          <p className="text-[13px] font-medium text-sa-primary">
                            {item.product?.name || "This product is unavailable"}
                          </p>
                          <p className="mt-2 text-[12px] text-sa-muted">
                            It may be hidden in this market. You can still remove it.
                          </p>
                          <div className="mt-4 self-end">{heart}</div>
                        </li>
                      );
                    }
                    const unavailable = item.product?.isSellable === false || card.price == null;
                    return (
                      <CatalogProductCard
                        key={item.productId}
                        product={card}
                        action={heart}
                        hideAdd={unavailable}
                        note={unavailable ? "Currently unavailable" : undefined}
                      />
                    );
                  })}
                </ul>
            </div>

            {totalPages > 1 ? (
              <CatalogPagination
                page={page}
                totalPages={totalPages}
                total={total}
                hrefForPage={(nextPage) =>
                  nextPage <= 1 ? listPath : `${listPath}?page=${nextPage}`
                }
              />
            ) : null}
          </>
        )}
      </div>
    </AccountPageShell>
  );
}
