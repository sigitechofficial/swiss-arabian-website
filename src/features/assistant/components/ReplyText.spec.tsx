import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ReplyText, replyBlocks } from "./ReplyText";

vi.mock("@/lib/i18n/LocaleLink", () => ({
  LocaleLink: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

describe("replyBlocks", () => {
  it("splits paragraphs on blank lines and keeps single line breaks", () => {
    expect(replyBlocks("One.\nStill one.\n\nTwo.")).toEqual([
      { kind: "p", lines: ["One.", "Still one."] },
      { kind: "p", lines: ["Two."] },
    ]);
  });

  it("turns consecutive list lines into one list, numbered or not", () => {
    expect(replyBlocks("Steps:\n- a\n- b\n\n1. x\n2) y")).toEqual([
      { kind: "p", lines: ["Steps:"] },
      { kind: "list", ordered: false, items: ["a", "b"] },
      { kind: "list", ordered: true, items: ["x", "y"] },
    ]);
  });

  it("keeps a plain text with no markup as it was", () => {
    expect(replyBlocks("Hello there")).toEqual([{ kind: "p", lines: ["Hello there"] }]);
    expect(replyBlocks("")).toEqual([]);
  });
});

describe("ReplyText: no printed addresses", () => {
  it("shows our own page addresses as named links, never as the address", () => {
    const { container } = render(<ReplyText text={"Please open /track and enter your number."} />);
    expect(screen.getByRole("link", { name: "Track an order" })).toHaveAttribute("href", "/track");
    expect(container.textContent).not.toContain("/track");
  });
});

describe("ReplyText", () => {
  it("draws bold and lists, and never reads HTML from a reply", () => {
    const { container } = render(<ReplyText text={"Free over **AED 250**.\n\n- Dubai: 1 day\n- Abu Dhabi: 2 days\n\n<img src=x onerror=alert(1)>"} />);
    expect(screen.getByText("AED 250").tagName).toBe("STRONG");
    expect(container.querySelectorAll("li")).toHaveLength(2);
    expect(container.querySelector("img")).toBeNull();
    expect(container.textContent).toContain("<img src=x onerror=alert(1)>");
  });

  it("still links only our own pages and https addresses", () => {
    render(<ReplyText text={"Read /policies/shipping or https://example.com/a and javascript:alert(1)"} />);
    expect(screen.getByRole("link", { name: "Read more" })).toHaveAttribute("href", "/policies/shipping");
    expect(screen.getByRole("link", { name: "https://example.com/a" })).toHaveAttribute("href", "https://example.com/a");
    expect(screen.getAllByRole("link")).toHaveLength(2);
  });
});
