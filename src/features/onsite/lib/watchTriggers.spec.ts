import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { watchOnsiteTriggers } from "./watchTriggers";

function setVisibility(state: "visible" | "hidden") {
  Object.defineProperty(document, "visibilityState", { value: state, configurable: true });
}

function scrollTo(scrollY: number, innerHeight: number, scrollHeight: number) {
  Object.defineProperty(window, "scrollY", { value: scrollY, configurable: true });
  Object.defineProperty(window, "innerHeight", { value: innerHeight, configurable: true });
  Object.defineProperty(document.documentElement, "scrollHeight", { value: scrollHeight, configurable: true });
  window.dispatchEvent(new Event("scroll"));
}

describe("watchOnsiteTriggers", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    setVisibility("visible");
    scrollTo(0, 800, 800);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("fires a page_view trigger immediately", () => {
    const onFire = vi.fn();
    const stop = watchOnsiteTriggers([{ type: "page_view" }], onFire);
    expect(onFire).toHaveBeenCalledTimes(1);
    expect(onFire).toHaveBeenCalledWith({ type: "page_view" }, { seconds: 0, scrollPercent: 0 });
    stop();
  });

  it("fires a dwell trigger once after its visible seconds, reporting the seconds reached", () => {
    const onFire = vi.fn();
    const stop = watchOnsiteTriggers([{ type: "dwell", seconds: 10 }], onFire);
    vi.advanceTimersByTime(9_000);
    expect(onFire).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1_000);
    expect(onFire).toHaveBeenCalledTimes(1);
    expect(onFire.mock.calls[0][1].seconds).toBe(10);
    vi.advanceTimersByTime(60_000);
    expect(onFire).toHaveBeenCalledTimes(1);
    stop();
  });

  it("does not count time while the tab is hidden", () => {
    const onFire = vi.fn();
    const stop = watchOnsiteTriggers([{ type: "dwell", seconds: 5 }], onFire);
    setVisibility("hidden");
    vi.advanceTimersByTime(60_000);
    expect(onFire).not.toHaveBeenCalled();
    setVisibility("visible");
    vi.advanceTimersByTime(5_000);
    expect(onFire).toHaveBeenCalledTimes(1);
    stop();
  });

  it("fires a scroll trigger once past its depth", () => {
    const onFire = vi.fn();
    const stop = watchOnsiteTriggers([{ type: "scroll", scrollPercent: 50 }], onFire);
    scrollTo(0, 800, 4000);
    expect(onFire).not.toHaveBeenCalled();
    scrollTo(1400, 800, 4000);
    expect(onFire).toHaveBeenCalledTimes(1);
    expect(onFire.mock.calls[0][1].scrollPercent).toBeGreaterThanOrEqual(50);
    scrollTo(3200, 800, 4000);
    expect(onFire).toHaveBeenCalledTimes(1);
    stop();
  });

  it("handles several triggers independently", () => {
    const onFire = vi.fn();
    const stop = watchOnsiteTriggers(
      [
        { type: "dwell", seconds: 2 },
        { type: "dwell", seconds: 4 },
      ],
      onFire,
    );
    vi.advanceTimersByTime(2_000);
    expect(onFire.mock.calls.map(([t]) => t.seconds)).toEqual([2]);
    vi.advanceTimersByTime(2_000);
    expect(onFire.mock.calls.map(([t]) => t.seconds)).toEqual([2, 4]);
    stop();
  });

  it("does nothing when there are no triggers, and stops on cleanup", () => {
    const none = vi.fn();
    watchOnsiteTriggers([], none)();
    vi.advanceTimersByTime(10_000);
    expect(none).not.toHaveBeenCalled();

    const onFire = vi.fn();
    const stop = watchOnsiteTriggers([{ type: "dwell", seconds: 3 }], onFire);
    stop();
    vi.advanceTimersByTime(10_000);
    expect(onFire).not.toHaveBeenCalled();
  });
});
