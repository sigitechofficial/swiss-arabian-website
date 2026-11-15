import type { OnsiteTrigger } from "../types";

/**
 * Times the triggers the backend asked for and reports each one once. Dwell counts visible seconds
 * only. Everything else (who may see what, how often) is decided by the backend: this only tells it
 * that a moment has arrived.
 */
export function watchOnsiteTriggers(
  triggers: OnsiteTrigger[],
  onFire: (trigger: OnsiteTrigger, observed: { seconds: number; scrollPercent: number }) => void,
): () => void {
  if (typeof window === "undefined" || typeof document === "undefined" || triggers.length === 0) {
    return () => undefined;
  }

  const fired = new Set<number>();
  let visibleSeconds = 0;
  let scrollPercent = 0;

  const fire = (index: number) => {
    if (fired.has(index)) return;
    fired.add(index);
    onFire(triggers[index], { seconds: visibleSeconds, scrollPercent });
  };

  // Page-view triggers fire straight away.
  triggers.forEach((trigger, index) => {
    if (trigger.type === "page_view") fire(index);
  });

  const timer = window.setInterval(() => {
    if (document.visibilityState !== "visible") return;
    visibleSeconds += 1;
    triggers.forEach((trigger, index) => {
      if (trigger.type === "dwell" && typeof trigger.seconds === "number" && visibleSeconds >= trigger.seconds) {
        fire(index);
      }
    });
  }, 1_000);

  const onScroll = () => {
    const root = document.documentElement;
    if (root.scrollHeight - window.innerHeight <= 0) return;
    scrollPercent = Math.min(
      100,
      Math.round(((window.scrollY + window.innerHeight) / root.scrollHeight) * 100),
    );
    triggers.forEach((trigger, index) => {
      if (trigger.type === "scroll" && typeof trigger.scrollPercent === "number" && scrollPercent >= trigger.scrollPercent) {
        fire(index);
      }
    });
  };
  window.addEventListener("scroll", onScroll, { passive: true });

  return () => {
    window.clearInterval(timer);
    window.removeEventListener("scroll", onScroll);
  };
}
