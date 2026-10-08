"use client";

import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/ui/Toaster";
import { getUserFacingErrorMessage } from "@/lib/api/userFacingErrors";
import { useUiStore } from "@/stores/useUiStore";
import { useApiMutation } from "@/lib/api/queryHooks";
import { wishlistKeys } from "../api/wishlist.keys";
import {
  addWishlistItem,
  clearWishlist,
  removeWishlistItem,
} from "../api/wishlist.service";
import type { StorefrontWishlistStatusView } from "../types/wishlist";

function patchStatusCaches(
  queryClient: ReturnType<typeof useQueryClient>,
  productId: string,
  inWishlist: boolean,
) {
  queryClient.setQueriesData<StorefrontWishlistStatusView>(
    { queryKey: wishlistKeys.statuses() },
    (old) => {
      if (!old) return old;
      const has = old.items.some((item) => item.productId === productId);
      return {
        items: has
          ? old.items.map((item) =>
              item.productId === productId ? { ...item, inWishlist } : item,
            )
          : [...old.items, { productId, inWishlist }],
      };
    },
  );
}

export function useWishlistMutations() {
  const queryClient = useQueryClient();
  const zoneCode =
    useUiStore((s) => s.selectedMarketId)?.trim() || "";

  const add = useApiMutation(
    (productId: string) => addWishlistItem(productId, zoneCode),
    {
      onMutate: async (productId) => {
        await queryClient.cancelQueries({ queryKey: wishlistKeys.statuses() });
        patchStatusCaches(queryClient, productId, true);
      },
      onError: (error, productId) => {
        patchStatusCaches(queryClient, productId, false);
        toast(getUserFacingErrorMessage(error), "error");
      },
      onSuccess: async (data) => {
        if (!data.alreadyPresent) {
          toast("Saved to wishlist", "success");
        }
        await queryClient.invalidateQueries({ queryKey: wishlistKeys.lists() });
      },
    },
  );

  const remove = useApiMutation(
    (productId: string) => removeWishlistItem(productId),
    {
      onMutate: async (productId) => {
        await queryClient.cancelQueries({ queryKey: wishlistKeys.statuses() });
        patchStatusCaches(queryClient, productId, false);
      },
      onError: (error, productId) => {
        patchStatusCaches(queryClient, productId, true);
        toast(getUserFacingErrorMessage(error), "error");
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: wishlistKeys.lists() });
      },
    },
  );

  const clear = useApiMutation(() => clearWishlist(), {
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: wishlistKeys.all });
      toast(
        data.itemCount > 0
          ? `Removed ${data.itemCount} saved ${data.itemCount === 1 ? "item" : "items"}`
          : "Wishlist is empty",
        "success",
      );
    },
    onError: (error) => {
      toast(getUserFacingErrorMessage(error), "error");
    },
  });

  async function toggle(productId: string, currentlyInWishlist: boolean) {
    try {
      if (currentlyInWishlist) {
        await remove.unwrap(productId);
        return;
      }
      await add.unwrap(productId);
    } catch {
      // onError already toasted / reverted optimistic state.
    }
  }

  return {
    add,
    remove,
    clear,
    toggle,
    isPending: add.isPending || remove.isPending || clear.isPending,
  };
}
