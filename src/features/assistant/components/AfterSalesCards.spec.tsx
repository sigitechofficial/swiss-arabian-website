import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { AfterSalesCards } from "./AfterSalesCards";
import type { AssistantAfterSalesOrder, AssistantAfterSalesRequest } from "../types";

vi.mock("@/lib/i18n/LocaleLink", () => ({
  LocaleLink: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const NUMBER = "UAE-MWVR2YG4-2753EB";

const open = { allowed: true, code: null, eligibleUntil: "2026-12-17T20:00:00.000Z", message: null };
const windowClosed = (code: string) => ({
  allowed: false,
  code,
  eligibleUntil: "2026-11-10T20:00:00.000Z",
  message: "The period has ended.",
});

const order = (over: Partial<AssistantAfterSalesOrder> = {}): AssistantAfterSalesOrder => ({
  orderId: "11111111-1111-4111-8111-111111111111",
  orderNumber: NUMBER,
  placedAt: "2026-11-03T10:00:00.000Z",
  itemCount: 2,
  statusLabel: "Delivered",
  returns: open,
  exchanges: windowClosed("EXCHANGE_WINDOW_CLOSED"),
  ...over,
});

const request = (over: Partial<AssistantAfterSalesRequest> = {}): AssistantAfterSalesRequest => ({
  kind: "RETURN",
  id: "ret-1",
  number: "RN-MWVQWE15-F000BF",
  orderNumber: NUMBER,
  orderId: "11111111-1111-4111-8111-111111111111",
  status: "REFUND_PENDING",
  statusMessage: "Your refund is being processed.",
  createdAt: "2026-11-20T09:00:00.000Z",
  unitCount: 1,
  ...over,
});

const hrefs = (root: HTMLElement) => within(root).getAllByRole("link").map((link) => link.getAttribute("href"));

describe("AfterSalesCards: orders", () => {
  it("shows the order number as an identifier, its date, state and item count", () => {
    const { container } = render(<AfterSalesCards view={{ kind: "ORDERS", orders: [order()] }} accent="bg-terra" />);
    const number = screen.getByText(NUMBER);
    expect(number.tagName).toBe("BDI");
    expect(number).toHaveAttribute("dir", "ltr");
    expect(number).toHaveAttribute("translate", "no");
    expect(screen.getByText("Order")).toBeInTheDocument();
    expect(container).toHaveTextContent(/3 Nov 2026/);
    expect(container).toHaveTextContent("Delivered · 2 items");
  });

  it("says what can be asked, with the last day, and why the other cannot, in the website's own words", () => {
    render(<AfterSalesCards view={{ kind: "ORDERS", orders: [order()] }} accent="bg-terra" />);
    expect(screen.getByText(/Return: you can ask until .*December 2026\./)).toBeInTheDocument();
    expect(screen.getByText(/The exchange period for this order ended on .*November 2026/)).toBeInTheDocument();
    expect(screen.queryByText(/Exchange: you can ask/)).toBeNull();
  });

  it("says both are open without a date when the policy gives none", () => {
    render(
      <AfterSalesCards
        view={{
          kind: "ORDERS",
          orders: [order({ returns: { ...open, eligibleUntil: null }, exchanges: { ...open, eligibleUntil: null } })],
        }}
        accent="bg-terra"
      />,
    );
    expect(screen.getByText("Return: you can ask now.")).toBeInTheDocument();
    expect(screen.getByText("Exchange: you can ask now.")).toBeInTheDocument();
  });

  it("gives one sentence when both are closed for the same reason, and no way to start", () => {
    const { container } = render(
      <AfterSalesCards
        view={{
          kind: "ORDERS",
          orders: [
            order({
              statusLabel: "In transit",
              returns: { allowed: false, code: "AFTER_SALES_NOT_DELIVERED_YET", eligibleUntil: null, message: null },
              exchanges: { allowed: false, code: "AFTER_SALES_NOT_DELIVERED_YET", eligibleUntil: null, message: null },
            }),
          ],
        }}
        accent="bg-terra"
      />,
    );
    expect(screen.getAllByText(/once your order is delivered/)).toHaveLength(1);
    expect(screen.getByText(/You can request a return or an exchange once your order is delivered/)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Return or exchange items" })).toBeNull();
    // Still a way to open the order.
    expect(hrefs(container)).toContain("/account/orders/11111111-1111-4111-8111-111111111111");
  });

  it("falls back to the server's sentence only for a reason the website has no wording for", () => {
    render(
      <AfterSalesCards
        view={{
          kind: "ORDERS",
          orders: [
            order({
              returns: { allowed: false, code: "SOME_NEW_CODE", eligibleUntil: null, message: "Returns are paused for this item." },
              exchanges: { allowed: false, code: "SOME_NEW_CODE", eligibleUntil: null, message: "Returns are paused for this item." },
            }),
          ],
        }}
        accent="bg-terra"
      />,
    );
    expect(screen.getByText("Returns are paused for this item.")).toBeInTheDocument();
  });

  it("links only to the customer's own order page, the return page when something can be asked, and the return terms", () => {
    const { container } = render(<AfterSalesCards view={{ kind: "ORDERS", orders: [order()] }} accent="bg-terra" />);
    expect(hrefs(container)).toEqual([
      "/account/orders/11111111-1111-4111-8111-111111111111/return",
      "/account/orders/11111111-1111-4111-8111-111111111111",
      "/return-terms",
    ]);
    expect(screen.getByRole("link", { name: "Return or exchange items" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View order" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Read the return terms" })).toBeInTheDocument();
  });

  it("an order id is put in the address safely", () => {
    const { container } = render(
      <AfterSalesCards view={{ kind: "ORDERS", orders: [order({ orderId: "a/b?c=d" })] }} accent="bg-terra" />,
    );
    expect(hrefs(container)).toContain("/account/orders/a%2Fb%3Fc%3Dd");
    expect(hrefs(container).some((href) => href?.includes("a/b"))).toBe(false);
  });

  it("draws every order, in the order given, as a labelled list", () => {
    render(
      <AfterSalesCards
        view={{
          kind: "ORDERS",
          orders: [order(), order({ orderId: "22222222-2222-4222-8222-222222222222", orderNumber: "UAE-OTHER-1111" })],
        }}
        accent="bg-terra"
      />,
    );
    const region = screen.getByRole("region", { name: "Your recent orders" });
    expect(within(region).getAllByRole("listitem").filter((li) => li.hasAttribute("data-assistant-after-sales-order"))).toHaveLength(2);
    expect(screen.getByText("UAE-OTHER-1111")).toBeInTheDocument();
  });

  it("uses the singular for one item", () => {
    const { container } = render(
      <AfterSalesCards view={{ kind: "ORDERS", orders: [order({ itemCount: 1 })] }} accent="bg-terra" />,
    );
    expect(container).toHaveTextContent("Delivered · 1 item");
    expect(container).not.toHaveTextContent("1 items");
  });
});

describe("AfterSalesCards: requests", () => {
  it("shows the kind, the number as an identifier, the date, and where the request is now", () => {
    const { container } = render(
      <AfterSalesCards
        view={{ kind: "REQUESTS", requests: [request(), request({ kind: "EXCHANGE", id: "ex-1", number: "EX-MWVQ-11" })] }}
        accent="bg-terra"
      />,
    );
    const returnNumber = screen.getByText("RN-MWVQWE15-F000BF");
    expect(returnNumber.tagName).toBe("BDI");
    expect(returnNumber).toHaveAttribute("dir", "ltr");
    expect(screen.getAllByText("Your refund is being processed.")).toHaveLength(2);
    expect(screen.getByText("Return")).toBeInTheDocument();
    expect(screen.getByText("Exchange")).toBeInTheDocument();
    expect(container).toHaveTextContent(/20 Nov 2026/);
    expect(screen.getByRole("region", { name: "Your return and exchange requests" })).toBeInTheDocument();
  });

  it("links to the customer's own order and the list of their requests, nowhere else", () => {
    const { container } = render(<AfterSalesCards view={{ kind: "REQUESTS", requests: [request()] }} accent="bg-terra" />);
    expect(hrefs(container)).toEqual(["/account/orders/11111111-1111-4111-8111-111111111111", "/account/returns"]);
    expect(screen.getByRole("link", { name: "View all requests" })).toBeInTheDocument();
  });

  it("offers no order link when the request has no order", () => {
    const { container } = render(
      <AfterSalesCards view={{ kind: "REQUESTS", requests: [request({ orderId: null, orderNumber: null })] }} accent="bg-terra" />,
    );
    expect(hrefs(container)).toEqual(["/account/returns"]);
  });

  it("shows the sentence as text, never as markup", () => {
    const { container } = render(
      <AfterSalesCards
        view={{ kind: "REQUESTS", requests: [request({ statusMessage: "<img src=x onerror=alert(1)> done" })] }}
        accent="bg-terra"
      />,
    );
    expect(container.querySelector("img")).toBeNull();
    expect(screen.getByText(/<img src=x onerror=alert\(1\)> done/)).toBeInTheDocument();
  });
});
