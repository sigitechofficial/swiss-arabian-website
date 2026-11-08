"use client";

import { useState } from "react";

/**
 * Runs `reset` during render when `value` changes (React's "adjusting state
 * when a prop changes" pattern). `reset` should only call state setters of
 * the calling component. Unlike a `useEffect` reset, the component never
 * renders once with stale state and needs no second commit.
 *
 * https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
 */
export function useResetOnChange<T>(value: T, reset: () => void): void {
  const [previous, setPrevious] = useState(value);
  if (!Object.is(previous, value)) {
    setPrevious(value);
    reset();
  }
}
