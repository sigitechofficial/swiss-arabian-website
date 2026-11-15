import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const url = vi.hoisted(() => ({ search: "" }));
vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams(url.search) }));

import { FaqCabinetFromUrl } from "./FaqCabinetFromUrl";

const current = (container: HTMLElement) =>
  container.querySelector('[aria-current="true"]')?.textContent ?? "";

describe("FaqCabinetFromUrl", () => {
  it("opens the drawer named in ?topic= (read in the browser; the page stays cached)", () => {
    url.search = "?topic=account";
    const { container } = render(<FaqCabinetFromUrl />);
    expect(current(container)).toContain("Account");
  });

  it("an unknown or missing topic opens the default drawer", () => {
    url.search = "?topic=nope";
    const unknown = render(<FaqCabinetFromUrl />);
    const fallback = current(unknown.container);
    unknown.unmount();
    url.search = "";
    const none = render(<FaqCabinetFromUrl />);
    expect(current(none.container)).toBe(fallback);
    expect(fallback).not.toContain("Account");
  });
});
