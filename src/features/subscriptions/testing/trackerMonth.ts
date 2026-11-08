import { screen, within } from "@testing-library/react";

/**
 * One month tile of the "Your 12-month plan" tracker, by plan position
 * (1 = first month). Looks rows up by structure, not by label: the visible
 * label is a calendar month name ("October") that depends on the start date.
 */
export function trackerMonth(month: number): HTMLElement {
  const plan = screen.getByRole("region", { name: "Your 12-month plan" });
  const row = within(plan).getAllByRole("listitem")[month - 1];
  if (!row) throw new Error(`Month ${month} is not in the tracker`);
  return row;
}
