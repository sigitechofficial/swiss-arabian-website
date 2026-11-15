/** Vitest stand-in for `next/root-params` (the Next compiler provides the real module). */
export async function locale(): Promise<string> {
  return "en";
}
