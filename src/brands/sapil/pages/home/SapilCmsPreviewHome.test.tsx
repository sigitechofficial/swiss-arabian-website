import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { formatMessage } from "@/lib/i18n/messages";
import { englishFallback } from "../../i18n/SapilCopy";

const loader = vi.hoisted(() => ({ loadCmsPreviewHome: vi.fn() }));
vi.mock("@/features/cms/preview/loadPreviewHome", () => loader);
vi.mock("../../i18n/server", () => ({
  sapilTranslator: async () => ({
    locale: "en",
    messages: englishFallback,
    t: (key: string, values?: Record<string, string | number>) => formatMessage("en", englishFallback, key, values),
  }),
}));
vi.mock("../../components/home/SapilHomeSections", () => ({
  SapilHomeSections: ({ sections }: { sections: unknown[] }) => <p data-testid="sapil-sections">{sections.length} sections</p>,
}));
vi.mock("../../components/shared/SapilLink", () => ({
  SapilLink: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

import { SapilCmsPreviewHome } from "./SapilCmsPreviewHome";

beforeEach(() => loader.loadCmsPreviewHome.mockReset());

describe("SapilCmsPreviewHome (/preview/home on Sapil)", () => {
  it("draws the Draft with Sapil's own home sections", async () => {
    loader.loadCmsPreviewHome.mockResolvedValue({
      status: "ready",
      zoneCode: "SAPIL_UAE",
      languageCode: "en-ae",
      result: { page: {}, sections: [{}, {}] },
    });
    render(await SapilCmsPreviewHome());
    expect(screen.getByTestId("sapil-sections")).toHaveTextContent("2 sections");
    expect(screen.getByRole("status")).toHaveTextContent("Draft preview · SAPIL_UAE · en-ae");
    expect(screen.getByRole("link", { name: "Exit preview" })).toHaveAttribute("href", "/");
    expect(document.querySelector('[data-brand="sapil"], [data-cms-home="preview"]')).not.toBeNull();
  });

  it("says when the session expired, in the v9 state panel", async () => {
    loader.loadCmsPreviewHome.mockResolvedValue({ status: "expired" });
    render(await SapilCmsPreviewHome());
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("This preview has expired.");
    expect(screen.queryByTestId("sapil-sections")).toBeNull();
  });

  it("explains an empty Draft", async () => {
    loader.loadCmsPreviewHome.mockResolvedValue({ status: "empty", zoneCode: "SAPIL_UAE", languageCode: "en-ae" });
    render(await SapilCmsPreviewHome());
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Nothing in this Draft.");
  });
});
