import type { OnsiteTrigger } from "../types";

/**
 * Times the triggers the backend asked for and reports each one once. Dwell counts visible seconds
 * only. Everything else (who may see what, how often) is decided by the backend: this only tells it
 * that a moment has arrived.
 */
export function watchOnsiteTriggers(
  triggers: OnsiteTrigger[],
  onFire: (
    trigger: OnsiteTrigger,
    observed: { seconds: number; scrollPercent: number; cartItems?: number },
  ) => void,
  /** How many items the bag holds right now. Needed only for idle nudges that wait for a bag. */
  getCartItems?: () => number,
): () => void {
  if (typeof window === "undefined" || typeof document === "undefined" || triggers.length === 0) {
    return () => undefined;
  }

  const fired = new Set<number>();
  let visibleSeconds = 0;
  let idleSeconds = 0;
  let scrollPercent = 0;

  const fire = (index: number, extra?: { seconds?: number; cartItems?: number }) => {
    if (fired.has(index)) return;
    fired.add(index);
    onFire(triggers[index], {
      seconds: extra?.seconds ?? visibleSeconds,
      scrollPercent,
      ...(extra?.cartItems === undefined ? {} : { cartItems: extra.cartItems }),
    });
  };

  // Page-view triggers fire straight away.
  triggers.forEach((trigger, index) => {
    if (trigger.type === "page_view") fire(index);
  });

  const timer = window.setInterval(() => {
    if (document.visibilityState !== "visible") return;
    visibleSeconds += 1;
    idleSeconds += 1;
    triggers.forEach((trigger, index) => {
      if (trigger.type === "idle" && typeof trigger.seconds === "number" && idleSeconds >= trigger.seconds) {
        const items = getCartItems ? getCartItems() : 0;
        // Waits (does not give up) until the bag has something in it when the rule asks for that.
        if (!trigger.cartNotEmpty || items > 0) fire(index, { seconds: idleSeconds, cartItems: items });
      }
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

  // Any sign of life starts the quiet time again.
  const wake = () => {
    idleSeconds = 0;
  };
  const wakeEvents = ["mousemove", "keydown", "touchstart", "click", "wheel"] as const;
  wakeEvents.forEach((name) => window.addEventListener(name, wake, { passive: true }));
  window.addEventListener("scroll", wake, { passive: true });

  // Exit intent (desktop): the pointer leaves through the top of the window, towards the tabs.
  const onLeave = (event: MouseEvent) => {
    if (event.clientY > 0 || event.relatedTarget) return;
    triggers.forEach((trigger, index) => {
      if (trigger.type === "exit_intent") fire(index);
    });
  };
  document.addEventListener("mouseout", onLeave);

  return () => {
    window.clearInterval(timer);
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("scroll", wake);
    wakeEvents.forEach((name) => window.removeEventListener(name, wake));
    document.removeEventListener("mouseout", onLeave);
  };
}
