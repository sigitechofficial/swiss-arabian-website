import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { loadSapilMessages } from "../../i18n/load";
import { SapilCopyProvider } from "../../i18n/SapilCopy";
import { ShopLocaleProvider } from "@/lib/i18n/ShopLocaleProvider";
import { loadMessages } from "@/lib/i18n/messages";

vi.mock("next/navigation", () => ({ usePathname: () => "/ar/account" }));
// next/font runs only in the Next compiler.
vi.mock("../../fonts", () => ({ sapilFontFamilies: {}, sapilFontVariables: "" }));

import { SapilPageLoading } from "./SapilPageLoading";
import { SapilFeaturePlaceholder } from "./SapilPlaceholders";

describe("SapilPageLoading", () => {
  it("is Sapil's (pastel tiles in a Sapil root), not the Swiss Arabian bottle mark", async () => {
    const messages = await loadSapilMessages("en");
    const { container } = render(
      <SapilCopyProvider messages={messages}>
        <SapilPageLoading label="Checking session…" fill />
      </SapilCopyProvider>,
    );
    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("data-brand", "sapil");
    expect(status).toHaveTextContent("Loading…");
    expect(container.querySelector("img")).toBeNull();
    expect(container.innerHTML).not.toMatch(/terra|loading-perfume/);
  });

  it("words what the route is loading, in the page's language", async () => {
    const en = await loadSapilMessages("en");
    const { unmount } = render(
      <SapilCopyProvider messages={en}>
        <SapilPageLoading label="Loading your order…" labelKey="order" fill />
      </SapilCopyProvider>,
    );
    expect(screen.getByRole("status")).toHaveTextContent("Loading your order…");
    unmount();
    const ar = await loadSapilMessages("ar");
    render(
      <ShopLocaleProvider locale="ar" messages={await loadMessages("ar")}>
        <SapilCopyProvider messages={ar}>
          <SapilPageLoading label="Checking session…" labelKey="session" fill />
        </SapilCopyProvider>
      </ShopLocaleProvider>,
    );
    expect(screen.getByRole("status")).toHaveTextContent("جارٍ التحقق من تسجيل دخولك…");
  });

  it("speaks the page's language outside the Sapil shell (sign-in fallbacks)", async () => {
    const shared = await loadMessages("ar");
    render(
      <ShopLocaleProvider locale="ar" messages={shared}>
        <SapilPageLoading label="Loading…" />
      </ShopLocaleProvider>,
    );
    expect(screen.getByRole("status")).toHaveTextContent("جارٍ التحميل…");
  });
});

describe("SapilFeaturePlaceholder", () => {
  it("uses the v9 state panel", () => {
    render(<SapilFeaturePlaceholder title="Stores" description="Coming soon." />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Stores");
    expect(screen.getByText("Coming soon.")).toBeInTheDocument();
    expect(document.body.innerHTML).not.toMatch(/sa-border|sa-primary/);
  });
});
