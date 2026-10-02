import type { StateStorage } from "zustand/middleware";
import { storefrontStorageKey } from "./brand";

/** Persist keys include the shop host so brands do not share cart / market. */
export function brandScopedStorage(): StateStorage {
  return {
    getItem: (name) => {
      if (typeof window === "undefined") return null;
      return window.localStorage.getItem(storefrontStorageKey(name));
    },
    setItem: (name, value) => {
      if (typeof window === "undefined") return;
      window.localStorage.setItem(storefrontStorageKey(name), value);
    },
    removeItem: (name) => {
      if (typeof window === "undefined") return;
      window.localStorage.removeItem(storefrontStorageKey(name));
    },
  };
}
