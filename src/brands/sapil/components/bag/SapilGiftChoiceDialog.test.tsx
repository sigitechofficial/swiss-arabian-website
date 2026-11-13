import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { loadSapilMessages } from "../../i18n/load";
import { SapilCopyProvider } from "../../i18n/SapilCopy";

const hook = vi.hoisted(() => ({
  select: vi.fn(),
  error: null as null | { code: string | null; message: string | null },
}));
vi.mock("@/features/promotions/hooks/useGiftChoiceDialog", () => ({
  useGiftChoiceDialog: () => ({
    gifts: [{ sku: "MINI-1", title: "Mini Berry", image: null, showSku: true }],
    select: hook.select,
    pending: false,
    error: hook.error,
  }),
}));

import { SapilGiftChoiceDialog } from "./SapilGiftChoiceDialog";

const award = { promotionCode: "GWP", choices: [] } as never;

describe("SapilGiftChoiceDialog", () => {
  it("offers the gifts in Sapil's dialog and chooses one", async () => {
    const messages = await loadSapilMessages("en");
    render(
      <SapilCopyProvider messages={messages}>
        <SapilGiftChoiceDialog award={award} celebrate={false} onClose={vi.fn()} />
      </SapilCopyProvider>,
    );
    expect(screen.getByRole("heading", { level: 2, hidden: true })).toHaveTextContent("A gift is yours.");
    fireEvent.click(screen.getByRole("button", { name: /Mini Berry.*Choose/, hidden: true }));
    expect(hook.select).toHaveBeenCalledWith("MINI-1");
  });

  it("words API errors in Sapil's copy", async () => {
    hook.error = { code: "GIFT_REMOVED", message: null };
    const messages = await loadSapilMessages("ar");
    render(
      <SapilCopyProvider messages={messages}>
        <SapilGiftChoiceDialog award={award} celebrate={false} onClose={vi.fn()} />
      </SapilCopyProvider>,
    );
    expect(screen.getByRole("alert", { hidden: true })).toHaveTextContent("أُزيلت هذه الهدية المجانية.");
  });
});
