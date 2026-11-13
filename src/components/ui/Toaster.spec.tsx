import { act, render, renderHook, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Toaster, toast, useToastFeed } from "./Toaster";

describe("toast hosts", () => {
  it("the default Toaster shows toasts when no brand host is mounted", () => {
    render(<Toaster />);
    act(() => toast("Saved to wishlist", "success"));
    expect(screen.getByText("Saved to wishlist")).toBeInTheDocument();
  });

  it("a brand host receives toasts and hides the default Toaster", () => {
    render(<Toaster />);
    const { result, unmount } = renderHook(() => useToastFeed());
    act(() => toast("Added to your bag"));
    expect(result.current).toMatchObject({ open: true, message: "Added to your bag", tone: "info" });
    expect(screen.queryByText("Added to your bag")).toBeNull();
    act(() => result.current.dismiss());
    expect(result.current.open).toBe(false);
    unmount();
    act(() => toast("Back to default"));
    expect(screen.getByText("Back to default")).toBeInTheDocument();
  });
});
