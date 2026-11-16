import { render, renderHook, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SapilLink, samePageAnchor } from "./SapilLink";
import { locationHashTarget, useScrollToLocationHash } from "./useScrollToLocationHash";

const nav = vi.hoisted(() => ({ pathname: "/" }));
vi.mock("next/navigation", () => ({ usePathname: () => nav.pathname }));

beforeEach(() => {
  nav.pathname = "/";
  document.body.innerHTML = "";
  window.history.replaceState(null, "", "/");
});

describe("samePageAnchor", () => {
  it("is the #section when the link's page is the page shown (any language)", () => {
    expect(samePageAnchor("/#mood", "/")).toBe("#mood");
    expect(samePageAnchor("/#mood", "/ar")).toBe("#mood");
    expect(samePageAnchor("/collections/sarab#products", "/ar/collections/sarab")).toBe("#products");
  });

  it("is null for another page, no hash, a query or another site", () => {
    expect(samePageAnchor("/#mood", "/blog")).toBeNull();
    expect(samePageAnchor("/collections/sarab", "/collections/sarab")).toBeNull();
    expect(samePageAnchor("/?x=1#mood", "/")).toBeNull();
    expect(samePageAnchor("/#", "/")).toBeNull();
    expect(samePageAnchor("//cdn.example.com/#a", "/")).toBeNull();
  });
});

describe("SapilLink with a section href (/#mood)", () => {
  it("is a plain in-page anchor on the home page", () => {
    render(<SapilLink href="/#mood">Mood</SapilLink>);
    expect(screen.getByRole("link", { name: "Mood" })).toHaveAttribute("href", "#mood");
  });

  it("opens the home page at the section from another page, in the page's language", () => {
    nav.pathname = "/blog";
    const { unmount } = render(<SapilLink href="/#mood">Mood</SapilLink>);
    expect(screen.getByRole("link", { name: "Mood" })).toHaveAttribute("href", "/#mood");
    unmount();
    nav.pathname = "/ar/blog";
    render(<SapilLink href="/#mood">Mood</SapilLink>);
    expect(screen.getByRole("link", { name: "Mood" })).toHaveAttribute("href", "/ar#mood");
  });
});

describe("useScrollToLocationHash", () => {
  it("scrolls to the address's section once the page is ready, only once", () => {
    const section = document.createElement("section");
    section.id = "mood";
    document.body.appendChild(section);
    const scroll = vi.fn();
    section.scrollIntoView = scroll;
    window.history.replaceState(null, "", "/#mood");

    const { rerender } = renderHook(({ ready }) => useScrollToLocationHash(ready), { initialProps: { ready: false } });
    expect(scroll).not.toHaveBeenCalled();
    rerender({ ready: true });
    expect(scroll).toHaveBeenCalledTimes(1);
    rerender({ ready: false });
    rerender({ ready: true });
    expect(scroll).toHaveBeenCalledTimes(1);
  });

  it("finds nothing without a hash or a matching element", () => {
    expect(locationHashTarget("")).toBeNull();
    expect(locationHashTarget("#missing")).toBeNull();
  });
});
