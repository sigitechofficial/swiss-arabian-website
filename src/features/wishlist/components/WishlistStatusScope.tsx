"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useWishlistStatusMap } from "../hooks/useWishlistStatus";
import { isProductUuid } from "../utils/productId";

type WishlistStatusContextValue = {
  inWishlist: (productId: string) => boolean;
  register: (productId: string) => void;
  unregister: (productId: string) => void;
};

const WishlistStatusContext = createContext<WishlistStatusContextValue | null>(
  null,
);

export function WishlistStatusScope({ children }: { children: ReactNode }) {
  const idsRef = useRef(new Set<string>());
  const [ids, setIds] = useState<string[]>([]);
  const flushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleFlush = useCallback(() => {
    if (flushTimer.current != null) return;
    flushTimer.current = setTimeout(() => {
      flushTimer.current = null;
      setIds([...idsRef.current]);
    }, 0);
  }, []);

  const register = useCallback(
    (productId: string) => {
      if (!isProductUuid(productId) || idsRef.current.has(productId)) return;
      idsRef.current.add(productId);
      scheduleFlush();
    },
    [scheduleFlush],
  );

  const unregister = useCallback(
    (productId: string) => {
      if (!idsRef.current.has(productId)) return;
      idsRef.current.delete(productId);
      scheduleFlush();
    },
    [scheduleFlush],
  );

  const { inWishlist } = useWishlistStatusMap(ids);

  useEffect(() => {
    return () => {
      if (flushTimer.current != null) {
        clearTimeout(flushTimer.current);
        flushTimer.current = null;
      }
    };
  }, []);

  const value = useMemo(
    () => ({ inWishlist, register, unregister }),
    [inWishlist, register, unregister],
  );

  return (
    <WishlistStatusContext.Provider value={value}>
      {children}
    </WishlistStatusContext.Provider>
  );
}

export function useWishlistStatusScope() {
  return useContext(WishlistStatusContext);
}
