import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SapilAnnouncement } from "./SapilAnnouncement";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));

const reduced = vi.hoisted(() => ({ value: false }));
const items = [
  { message: "First **message**", link: null },
  { message: "Second message", link: null },
] as never;

beforeEach(() => {
  vi.useFakeTimers();
  reduced.value = false;
  window.matchMedia = ((q: string) => ({
    matches: q.includes("reduce") ? reduced.value : false,
    media: q,
    addEventListener() {},
    removeEventListener() {},
  })) as never;
});
afterEach(() => vi.useRealTimers());

describe("SapilAnnouncement", () => {
  it("rotates, is not a live region, and the pause button stops the rotation (WCAG 2.2.2)", () => {
    const { container } = render(<SapilAnnouncement items={items} intervalMs={3000} />);
    expect(container.querySelector("[aria-live]")).toBeNull();
    expect(screen.getByText("message")).toBeTruthy();
    act(() => vi.advanceTimersByTime(3000));
    expect(screen.getByText("Second message")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Pause announcements" }));
    // The pointer/focus is still on the bar after the click: leave it, then wait.
    fireEvent.blur(screen.getByRole("button", { name: "Play announcements" }));
    act(() => vi.advanceTimersByTime(10000));
    expect(screen.getByText("Second message")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Play announcements" }));
    fireEvent.blur(screen.getByRole("button", { name: "Pause announcements" }));
    act(() => vi.advanceTimersByTime(3000));
    expect(screen.getByText("message")).toBeTruthy();
  });

  it("waits while the pointer is on the bar", () => {
    const { container } = render(<SapilAnnouncement items={items} intervalMs={3000} />);
    fireEvent.mouseEnter(container.firstElementChild!);
    act(() => vi.advanceTimersByTime(9000));
    expect(screen.getByText("message")).toBeTruthy();
    fireEvent.mouseLeave(container.firstElementChild!);
    act(() => vi.advanceTimersByTime(3000));
    expect(screen.getByText("Second message")).toBeTruthy();
  });

  it("does not rotate with reduced motion until the shopper presses play", () => {
    reduced.value = true;
    render(<SapilAnnouncement items={items} intervalMs={3000} />);
    act(() => vi.advanceTimersByTime(9000));
    expect(screen.getByText("message")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Play announcements" })).toBeTruthy();
  });

  it("a single message has no control", () => {
    render(<SapilAnnouncement items={[{ message: "Only one", link: null }] as never} />);
    expect(screen.queryByRole("button")).toBeNull();
  });
});
