import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SCROLL_DEPTH_STEPS, startEngagementWatch } from "./engagement";

function setScroll(scrollY: number, innerHeight: number, scrollHeight: number) {
  Object.defineProperty(window, "scrollY", { value: scrollY, configurable: true });
  Object.defineProperty(window, "innerHeight", { value: innerHeight, configurable: true });
  Object.defineProperty(document.documentElement, "scrollHeight", {
    value: scrollHeight,
    configurable: true,
  });
  window.dispatchEvent(new Event("scroll"));
}

function setVisibility(state: "visible" | "hidden") {
  Object.defineProperty(document, "visibilityState", { value: state, configurable: true });
}

describe("startEngagementWatch", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    setVisibility("visible");
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("fires the engagement threshold once after the visible seconds", () => {
    const onThreshold = vi.fn();
    const stop = startEngagementWatch({ seconds: 10, onThreshold, onScrollDepth: vi.fn() });
    vi.advanceTimersByTime(9_000);
    expect(onThreshold).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1_000);
    expect(onThreshold).toHaveBeenCalledTimes(1);
    expect(onThreshold).toHaveBeenCalledWith(10);
    vi.advanceTimersByTime(30_000);
    expect(onThreshold).toHaveBeenCalledTimes(1);
    stop();
  });

  it("does not count time while the tab is hidden", () => {
    const onThreshold = vi.fn();
    const stop = startEngagementWatch({ seconds: 5, onThreshold, onScrollDepth: vi.fn() });
    setVisibility("hidden");
    vi.advanceTimersByTime(60_000);
    expect(onThreshold).not.toHaveBeenCalled();
    setVisibility("visible");
    vi.advanceTimersByTime(5_000);
    expect(onThreshold).toHaveBeenCalledTimes(1);
    stop();
  });

  it("reports each scroll depth step once", () => {
    const onScrollDepth = vi.fn();
    const stop = startEngagementWatch({ seconds: 10, onThreshold: vi.fn(), onScrollDepth });
    setScroll(0, 800, 4000); // 20%
    expect(onScrollDepth).not.toHaveBeenCalled();
    setScroll(400, 800, 4000); // 30%
    expect(onScrollDepth.mock.calls.map((c) => c[0])).toEqual([25]);
    setScroll(1200, 800, 4000); // 50%
    setScroll(1200, 800, 4000);
    expect(onScrollDepth.mock.calls.map((c) => c[0])).toEqual([25, 50]);
    setScroll(3200, 800, 4000); // 100%
    expect(onScrollDepth.mock.calls.map((c) => c[0])).toEqual([25, 50, 75, 100]);
    expect(SCROLL_DEPTH_STEPS).toEqual([25, 50, 75, 100]);
    stop();
  });

  it("ignores pages that do not scroll", () => {
    const onScrollDepth = vi.fn();
    const stop = startEngagementWatch({ seconds: 10, onThreshold: vi.fn(), onScrollDepth });
    setScroll(0, 800, 700);
    expect(onScrollDepth).not.toHaveBeenCalled();
    stop();
  });

  it("stops everything on cleanup", () => {
    const onThreshold = vi.fn();
    const onScrollDepth = vi.fn();
    const stop = startEngagementWatch({ seconds: 2, onThreshold, onScrollDepth });
    stop();
    vi.advanceTimersByTime(10_000);
    setScroll(3200, 800, 4000);
    expect(onThreshold).not.toHaveBeenCalled();
    expect(onScrollDepth).not.toHaveBeenCalled();
  });
});
