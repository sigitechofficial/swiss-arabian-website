import { act, fireEvent, render, renderHook, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
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

  it("shows a toast's button and closes the toast before running it", () => {
    render(<Toaster />);
    const onClick = vi.fn();
    act(() => toast("Added to your bag", "success", { label: "View bag", onClick }));
    fireEvent.click(screen.getByRole("button", { name: "View bag" }));
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("Added to your bag")).toBeNull();
  });

  it("passes the button to a brand host", () => {
    const { result, unmount } = renderHook(() => useToastFeed());
    const onClick = vi.fn();
    act(() => toast("Added to your bag", "success", { label: "View bag", onClick }));
    expect(result.current.action?.label).toBe("View bag");
    unmount();
  });
});
