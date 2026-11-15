"use client";

import { usePathname } from "next/navigation";
import { PageLoading } from "@/components/ui";
import { stripLocalePrefix } from "@/lib/i18n/localePath";
import { useShopCopy } from "@/lib/i18n/useShopCopy";
import { AccountPageShell } from "@/features/account/components/AccountPageShell";
import { AccountPageTitle } from "@/features/account/components/AccountPageTitle";
import { accountContainer } from "@/features/account/constants/accountLayout";
import { CatalogEmptyState } from "@/features/catalog/components/CatalogEmptyState";
import { CatalogProductCard } from "@/features/catalog/components/catalog/CatalogProductCard";
import { CatalogPagination } from "@/features/catalog/components/CatalogPagination";
import { getUserFacingErrorMessage } from "@/lib/api/userFacingErrors";
import { useAccountWishlist } from "../hooks/useAccountWishlist";
import { WishlistHeartButton } from "./WishlistHeartButton";
import { wishlistBand, wishlistGrid } from "@/styles/shopChrome";

type AccountWishlistPageViewProps = {
  title: string;
};

export function AccountWishlistPageView({ title }: AccountWishlistPageViewProps) {
  const { data, items, isLoading, isError, error, refetch, isFetching, page, total, totalPages, cards, confirmClear, setConfirmClear, clear } =
    useAccountWishlist();
  const t = useShopCopy();
  // The same view serves both addresses; the title is translated, so read the path.
  const pathname = stripLocalePrefix(usePathname() || "/");
  const listPath = pathname.startsWith("/account/saved") ? "/account/saved" : "/account/wishlist";

  return (
    <AccountPageShell>
      <AccountPageTitle
        title={title}
        subtitle={
          total > 0 ? t("wishlist.count", { count: total }) : t("wishlist.emptyLede")
        }
      />

      <div className={`${accountContainer} pb-16`}>
        {isLoading && !data ? (
          <PageLoading label={t("loadingLabel.savedItems")} />
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
              {t("tryAgain")}
            </button>
          </div>
        ) : !items?.length && total === 0 ? (
          <CatalogEmptyState
            title={t("wishlist.empty")}
            description={t("wishlist.emptyText")}
            backLabel={t("wishlist.backHome")}
          />
        ) : !items?.length ? (
          <div className="rounded-lg border border-sa-border bg-section-soft px-6 py-10">
            <p className="text-[13px] text-sa-secondary">
              {t("wishlist.hiddenPage")}
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
                    {t("wishlist.clearConfirm")}
                  </span>
                  <button
                    type="button"
                    disabled={clear.isPending}
                    onClick={() => {
                      void clear.unwrap().finally(() => setConfirmClear(false));
                    }}
                    className="cursor-pointer font-semibold text-terra hover:underline disabled:opacity-50"
                  >
                    {clear.isPending ? t("wishlist.removing") : t("wishlist.yesClear")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmClear(false)}
                    className="cursor-pointer font-semibold text-sa-muted hover:text-sa-primary"
                  >
                    {t("account.cancel")}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmClear(true)}
                  className="cursor-pointer text-[12px] font-semibold uppercase tracking-[0.08em] text-sa-muted hover:text-terra"
                >
                  {t("wishlist.clearAll")}
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
                            {item.product?.name || t("wishlist.unavailableProduct")}
                          </p>
                          <p className="mt-2 text-[12px] text-sa-muted">
                            {t("wishlist.hiddenItem")}
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
                        note={unavailable ? t("wishlist.currentlyUnavailable") : undefined}
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
