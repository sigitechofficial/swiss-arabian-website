import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OnsiteMessageView } from "./OnsiteMessageView";
import type { OnsiteMessage } from "../types";

const popup: OnsiteMessage = {
  ruleId: "rule-1",
  slot: "POPUP",
  title: "Welcome",
  body: "Take a look around",
  ctaLabel: "Shop now",
  ctaUrl: "/products",
};

describe("OnsiteMessageView popup", () => {
  it("shows the message as a labelled dialog with its call to action", () => {
    render(<OnsiteMessageView message={popup} onDismiss={vi.fn()} onCta={vi.fn()} />);
    const dialog = screen.getByRole("dialog", { name: "Welcome" });
    expect(dialog).toHaveTextContent("Take a look around");
    expect(screen.getByRole("link", { name: "Shop now" })).toHaveAttribute("href", "/products");
  });

  it("covers the whole page, including the fixed site header (z-200)", () => {
    const { container } = render(<OnsiteMessageView message={popup} onDismiss={vi.fn()} onCta={vi.fn()} />);
    expect((container.firstElementChild as HTMLElement).className).toContain("z-[220]");
  });

  it("moves focus to the close button", () => {
    render(<OnsiteMessageView message={popup} onDismiss={vi.fn()} onCta={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Close" })).toHaveFocus();
  });

  it("dismisses with the close button, Escape and a click outside", async () => {
    const onDismiss = vi.fn();
    const user = userEvent.setup();
    const { container } = render(<OnsiteMessageView message={popup} onDismiss={onDismiss} onCta={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "Close" }));
    await user.keyboard("{Escape}");
    await user.click(container.firstElementChild as HTMLElement);
    expect(onDismiss).toHaveBeenCalledTimes(3);
  });

  it("does not dismiss when the dialog itself is clicked", async () => {
    const onDismiss = vi.fn();
    const user = userEvent.setup();
    render(<OnsiteMessageView message={popup} onDismiss={onDismiss} onCta={vi.fn()} />);
    await user.click(screen.getByRole("dialog"));
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it("reports a click on the call to action", async () => {
    const onCta = vi.fn((event?: unknown) => event);
    const user = userEvent.setup();
    render(<OnsiteMessageView message={popup} onDismiss={vi.fn()} onCta={onCta} />);
    await user.click(screen.getByRole("link", { name: "Shop now" }));
    expect(onCta).toHaveBeenCalledTimes(1);
  });

  it("leaves out the call to action when there is no label and link", () => {
    render(
      <OnsiteMessageView message={{ ...popup, ctaLabel: undefined, ctaUrl: undefined }} onDismiss={vi.fn()} onCta={vi.fn()} />,
    );
    expect(screen.queryByRole("link")).toBeNull();
  });
});

describe("OnsiteMessageView banner", () => {
  const banner: OnsiteMessage = { ...popup, slot: "BANNER" };

  it("renders a labelled bar, not a modal dialog", () => {
    render(<OnsiteMessageView message={banner} onDismiss={vi.fn()} onCta={vi.fn()} />);
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByRole("region", { name: "Welcome" })).toHaveTextContent("Take a look around");
  });

  it("sits above the fixed site header (z-200) and at the bottom, so it never hides the menu", () => {
    render(<OnsiteMessageView message={banner} onDismiss={vi.fn()} onCta={vi.fn()} />);
    const bar = screen.getByRole("region", { name: "Welcome" });
    expect(bar.className).toContain("z-[210]");
    expect(bar.className).toContain("bottom-0");
    expect(bar.className).not.toContain("top-0");
  });

  it("can be closed", async () => {
    const onDismiss = vi.fn();
    const user = userEvent.setup();
    render(<OnsiteMessageView message={banner} onDismiss={onDismiss} onCta={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
