/**
 * Watches one page for engagement: visible seconds and scroll depth. Pure DOM so it can be tested
 * with fake timers. Each threshold fires once per watcher (one watcher per page view).
 */
export const SCROLL_DEPTH_STEPS = [25, 50, 75, 100] as const;

export type EngagementOptions = {
  seconds: number;
  onThreshold: (seconds: number) => void;
  onScrollDepth: (percent: number) => void;
};

export function startEngagementWatch(options: EngagementOptions): () => void {
  if (typeof window === "undefined" || typeof document === "undefined") return () => undefined;

  let visibleMs = 0;
  let thresholdFired = false;
  const firedDepths = new Set<number>();
  const tickMs = 1_000;

  const timer = window.setInterval(() => {
    if (document.visibilityState !== "visible") return;
    visibleMs += tickMs;
    if (!thresholdFired && visibleMs >= options.seconds * 1_000) {
      thresholdFired = true;
      options.onThreshold(options.seconds);
    }
  }, tickMs);

  const onScroll = () => {
    const root = document.documentElement;
    const scrollable = root.scrollHeight - window.innerHeight;
    if (scrollable <= 0) return;
    const percent = Math.min(
      100,
      Math.round(((window.scrollY + window.innerHeight) / root.scrollHeight) * 100),
    );
    for (const step of SCROLL_DEPTH_STEPS) {
      if (percent >= step && !firedDepths.has(step)) {
        firedDepths.add(step);
        options.onScrollDepth(step);
      }
    }
  };
  window.addEventListener("scroll", onScroll, { passive: true });

  return () => {
    window.clearInterval(timer);
    window.removeEventListener("scroll", onScroll);
  };
}
