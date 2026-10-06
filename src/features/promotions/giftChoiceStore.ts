import { create } from "zustand";

type GiftChoiceState = {
  openCode: string | null;
  celebrate: boolean;
  flashing: boolean;
  open: (code: string, options?: { celebrate?: boolean }) => void;
  close: () => void;
};

export const useGiftChoiceStore = create<GiftChoiceState>((set, get) => ({
  openCode: null,
  celebrate: false,
  flashing: false,
  open: (code, options) => {
    const celebrate = Boolean(options?.celebrate);
    set({ openCode: code, celebrate, flashing: celebrate });
    if (celebrate) {
      window.setTimeout(() => {
        if (get().openCode === code) set({ flashing: false });
      }, 700);
    }
  },
  close: () => set({ openCode: null, celebrate: false, flashing: false }),
}));
