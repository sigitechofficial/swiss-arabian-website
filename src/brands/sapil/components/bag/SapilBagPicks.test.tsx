import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const recovery = vi.hoisted(() => vi.fn());

vi.mock("@/features/promotions/hooks/useEmptyBagRecovery", () => ({
  railHeading: (heading: string) => heading,
  useEmptyBagRecovery: recovery,
}));
vi.mock("@/features/promotions/hooks/usePromotionQuickAdd", () => ({ usePromotionQuickAdd: vi.fn() }));

import { SapilEmptyBagPicks } from "./SapilBagPicks";

beforeEach(() => {
  recovery.mockReset();
  recovery.mockReturnValue({ groups: [], addLabel: "", busy: null, add: vi.fn(), trackClick: vi.fn() });
});

describe("SapilEmptyBagPicks", () => {
  it("holds the suggestions request while the bag drawer is closed", () => {
    render(<SapilEmptyBagPicks surface="empty-drawer" active={false} />);
    expect(recovery).toHaveBeenCalledWith("empty-drawer", { enabled: false });
  });

  it("asks for suggestions once the drawer is open, and on the bag page", () => {
    render(<SapilEmptyBagPicks surface="empty-drawer" active />);
    render(<SapilEmptyBagPicks surface="empty-cart" />);
    expect(recovery).toHaveBeenCalledWith("empty-drawer", { enabled: true });
    expect(recovery).toHaveBeenCalledWith("empty-cart", { enabled: true });
  });
});
