import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { pickPdpMetafields } from "../../utils/pdpMetafields";
import { toCatalogProduct } from "../../utils/toCatalogProduct";
import { PdpComposition } from "./PdpComposition";

/*
 * Swiss Arabian product page, "Details" tab: the rows come from the product's
 * PDP metafields (family, size) and its collection. Pins what `5a55282` showed.
 */

function stubMatchMedia(matches: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    })),
  );
}

const product = toCatalogProduct({
  id: "p1",
  slug: "gharam",
  title: "Gharam",
  price: 100,
  currency: "AED",
  sku: "GH-50",
});
const metafields = pickPdpMetafields({
  fragrance_family_text: "Amber, Fresh, Woody",
  size: "50 ML",
  top_note: "Jasmine, Saffron",
});

function renderComposition() {
  return render(
    <PdpComposition
      product={product}
      content={{ story: "A story.", notes: [], wear: "", shipping: "", authenticity: "" }}
      metafields={metafields}
      formatLabel={metafields?.size ?? ""}
      notesHeading="Notes"
      notesRows={[]}
      showNotes={false}
      showLongevityBars={false}
      shippingCopy=""
      resetKey="gharam"
    />,
  );
}

function detailsRows() {
  const list = document.querySelector("dl");
  expect(list).not.toBeNull();
  return [...list!.querySelectorAll(":scope > div")].map((row) => {
    const term = row.querySelector("dt")?.textContent ?? "";
    const value = row.querySelector("dd")?.textContent ?? "";
    return [term, value];
  });
}

describe("PdpComposition Details", () => {
  beforeEach(() => vi.unstubAllGlobals());

  it("lists family, perfumer, format, collection and origin (desktop tabs)", () => {
    stubMatchMedia(false);
    renderComposition();
    fireEvent.click(screen.getByRole("tab", { name: "Details" }));
    const panel = document.querySelector("dl")!.closest("[role=tabpanel]") as HTMLElement;
    expect(panel.hidden).toBe(false);
    expect(detailsRows()).toEqual([
      ["Family", "Amber, Fresh, Woody"],
      ["Perfumer", "Not published"],
      ["Format", "50 ML"],
      ["Collection", "Signature"],
      ["Origin", "United Arab Emirates"],
    ]);
  });

  it("opens the same rows from the phone accordion", () => {
    stubMatchMedia(true);
    renderComposition();
    const button = screen.getAllByRole("button", { name: /Details/ }).find((b) => b.hasAttribute("aria-expanded"))!;
    fireEvent.click(button);
    const panel = document.querySelector("dl")!.closest("[role=tabpanel]") as HTMLElement;
    expect(panel.hidden).toBe(false);
    expect(within(panel).getByText("Amber, Fresh, Woody")).toBeInTheDocument();
    expect(detailsRows()).toHaveLength(5);
  });
});
