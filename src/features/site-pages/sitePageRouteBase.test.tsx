import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({
  fetchSitePage: vi.fn(),
  fetchSitePagePreview: vi.fn(),
  fetchSitePages: vi.fn(),
}));

vi.mock("@/lib/seo/requestMarket", () => ({
  resolveRequestCatalogMarket: async () => ({ locale: "en", zoneCode: "UAE" }),
}));
vi.mock("@/lib/i18n/messages", () => ({
  getTranslator: async () => (key: string) => (key === "home" ? "Home" : "Contact details"),
}));
vi.mock("@/features/catalog/components/CatalogJsonLd", () => ({
  breadcrumbJsonLd: () => ({}),
  CatalogJsonLd: () => null,
}));
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
  permanentRedirect: (to: string) => {
    throw new Error(`REDIRECT ${to}`);
  },
}));
vi.mock("./api/sitePages.service", () => api);

import { SitePageRouteBase, type SitePageViewProps } from "./sitePageRouteBase";

const page = {
  title: "Privacy policy",
  path: "/policies/privacy-policy",
  bodyHtml: "<p>Text</p>",
  templateSuffix: null,
};

function View({ page: p, locale, contactDetailsLabel }: SitePageViewProps) {
  return (
    <p data-testid="view">
      {p.title} · {locale} · {contactDetailsLabel}
    </p>
  );
}
function Notice({ preview }: { preview: { number: number } }) {
  return <p data-testid="notice">v{preview.number}</p>;
}

beforeEach(() => {
  api.fetchSitePage.mockReset();
  api.fetchSitePagePreview.mockReset();
  api.fetchSitePages.mockReset().mockResolvedValue([]);
});

describe("SitePageRouteBase", () => {
  it("renders the brand's view (not a fixed one)", async () => {
    api.fetchSitePage.mockResolvedValue(page);
    render(await SitePageRouteBase({ kind: "POLICY", handle: "privacy-policy", View, PreviewNotice: Notice }));
    expect(screen.getByTestId("view")).toHaveTextContent("Privacy policy · en · Contact details");
    expect(screen.queryByTestId("notice")).toBeNull();
  });

  it("shows the brand's preview notice for an admin preview link", async () => {
    api.fetchSitePagePreview.mockResolvedValue({ ...page, preview: { number: 3, label: "x", status: "DRAFT", effectiveFrom: null } });
    render(
      await SitePageRouteBase({
        kind: "PAGE",
        handle: "about",
        previewParams: { previewVersion: "1", previewExp: "2", previewToken: "t" },
        View,
        PreviewNotice: Notice,
      }),
    );
    expect(screen.getByTestId("notice")).toHaveTextContent("v3");
  });

  it("answers not found for an unknown page", async () => {
    api.fetchSitePage.mockResolvedValue(null);
    await expect(
      SitePageRouteBase({ kind: "PAGE", handle: "nope", View, PreviewNotice: Notice }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });
});
