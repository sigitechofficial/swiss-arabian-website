import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OnsiteMessageView } from "../components/OnsiteMessageView";
import type { OnsiteMessage } from "../types";
import { OnsiteDesignView } from "./OnsiteDesignView";
import { countdownParts, resolveDesign, type OnsiteDesign } from "./onsiteDesign";
import { isRtl } from "@/lib/i18n/locales";

const design: OnsiteDesign = {
  version: 1,
  layout: {
    type: "popup",
    position: "center",
    width: 420,
    background: "#fbf7f0",
    textColor: "#2c241d",
    radius: 16,
    padding: 24,
    gap: 12,
    align: "center",
    overlayColor: "#000000",
    overlayOpacity: 45,
    closeOnOverlay: true,
    showClose: true,
    closeColor: "#2c241d",
    animation: "none",
    autoCloseSeconds: 0,
  },
  blocks: [
    { id: "title", type: "text", text: { en: "Big sale", ar: "تخفيضات" }, size: 28, weight: 600, color: "#2c241d" },
    { id: "only-desktop", type: "text", text: { en: "Desktop only" }, size: 14, weight: 400, color: "#2c241d", hideOn: ["mobile"] },
    { id: "code", type: "coupon", code: "SALE20", copyLabel: { en: "Copy" }, copiedLabel: { en: "Copied" }, background: "#ffffff", color: "#2c241d" },
    { id: "cta", type: "button", label: { en: "Shop now" }, action: "link", href: "/products", background: "#b46e57", color: "#ffffff", radius: 24, size: "md", fullWidth: false },
    { id: "later", type: "button", label: { en: "Maybe later" }, action: "close", background: "#ffffff", color: "#2c241d", radius: 24, size: "sm", fullWidth: false },
  ],
};

const message: OnsiteMessage = {
  ruleId: "rule-1",
  slot: "POPUP",
  title: "Plain title",
  body: "",
  design: resolveDesign(design, "en"),
};

describe("OnsiteMessageView with a design", () => {
  it("draws the design instead of the plain message", () => {
    render(<OnsiteMessageView message={message} onDismiss={vi.fn()} onCta={vi.fn()} />);
    expect(screen.getByRole("dialog")).toHaveTextContent("Big sale");
    expect(screen.queryByText("Plain title")).toBeNull();
    expect(screen.getByRole("link", { name: "Shop now" })).toHaveAttribute("href", "/products");
  });

  it("reports the link click, and closes from the close button or a close action", async () => {
    const onDismiss = vi.fn();
    const onCta = vi.fn();
    render(<OnsiteMessageView message={message} onDismiss={onDismiss} onCta={onCta} />);
    await userEvent.click(screen.getByRole("link", { name: "Shop now" }));
    expect(onCta).toHaveBeenCalledTimes(1);
    await userEvent.click(screen.getByRole("button", { name: "Maybe later" }));
    await userEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onDismiss).toHaveBeenCalledTimes(2);
  });
});

describe("OnsiteDesignView", () => {
  it("hides blocks for the device and turns right-to-left for Arabic", () => {
    render(
      <OnsiteDesignView design={resolveDesign(design, "ar", undefined, isRtl)} device="mobile" frame="canvas" onClose={vi.fn()} />,
    );
    expect(screen.getByRole("dialog")).toHaveAttribute("dir", "rtl");
    expect(screen.getByText("تخفيضات")).toBeInTheDocument();
    expect(screen.queryByText("Desktop only")).toBeNull();
  });

  it("selects blocks instead of acting while editing", async () => {
    const onSelect = vi.fn();
    const onClose = vi.fn();
    render(
      <OnsiteDesignView
        design={resolveDesign(design, "en")}
        device="desktop"
        frame="canvas"
        onClose={onClose}
        editing={{ selectedId: null, onSelect }}
      />,
    );
    await userEvent.click(screen.getByText("Big sale"));
    expect(onSelect).toHaveBeenLastCalledWith("title");
    await userEvent.click(screen.getByRole("button", { name: "Maybe later" }));
    expect(onSelect).toHaveBeenLastCalledWith("later");
    expect(onClose).not.toHaveBeenCalled();
  });
});

describe("countdownParts", () => {
  it("splits the time left and stops at zero", () => {
    const now = Date.parse("2026-11-18T10:00:00Z");
    expect(countdownParts("2026-11-19T12:30:15Z", now)).toEqual({ days: 1, hours: 2, minutes: 30, seconds: 15 });
    expect(countdownParts("2026-11-18T09:00:00Z", now)).toBeNull();
    expect(countdownParts("not a date", now)).toBeNull();
  });
});

describe("OnsiteDesignView email form", () => {
  const leadDesign: OnsiteDesign = {
    ...design,
    blocks: [
      { id: "title", type: "text", text: { en: "Join us" }, size: 24, weight: 600, color: "#2c241d" },
      {
        id: "form",
        type: "form",
        emailLabel: { en: "Email" },
        emailPlaceholder: { en: "Your email" },
        phone: "off",
        phoneLabel: { en: "Phone" },
        interests: [],
        interestsLabel: { en: "" },
        consentText: { en: "I agree to receive emails" },
        submitLabel: { en: "Subscribe" },
        buttonBackground: "#000000",
        buttonColor: "#ffffff",
        radius: 8,
      },
    ],
    success: { blocks: [{ id: "thanks", type: "text", text: { en: "Thanks!" }, size: 20, weight: 600, color: "#2c241d" }] },
  };

  it("asks for consent, sends the email and then shows the thank-you page", async () => {
    const onLead = vi.fn().mockResolvedValue({ prize: null });
    render(
      <OnsiteDesignView design={resolveDesign(leadDesign, "en")} device="desktop" frame="canvas" onClose={vi.fn()} onLead={onLead} />,
    );
    await userEvent.type(screen.getByLabelText(/Email/), "sara@example.com");
    await userEvent.click(screen.getByRole("button", { name: "Subscribe" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Please tick the box to agree.");
    expect(onLead).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole("checkbox"));
    await userEvent.click(screen.getByRole("button", { name: "Subscribe" }));
    expect(onLead).toHaveBeenCalledWith({ email: "sara@example.com", phone: "", interests: [], consent: true });
    expect(await screen.findByText("Thanks!")).toBeInTheDocument();
    expect(screen.queryByText("Join us")).toBeNull();
  });

  it("shows the reason when sending fails", async () => {
    const onLead = vi.fn().mockRejectedValue(new Error("This offer is no longer available."));
    render(
      <OnsiteDesignView design={resolveDesign(leadDesign, "en")} device="desktop" frame="canvas" onClose={vi.fn()} onLead={onLead} />,
    );
    await userEvent.type(screen.getByLabelText(/Email/), "sara@example.com");
    await userEvent.click(screen.getByRole("checkbox"));
    await userEvent.click(screen.getByRole("button", { name: "Subscribe" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("This offer is no longer available.");
  });

  it("words its own checks in the language it is given", async () => {
    const onLead = vi.fn();
    render(
      <OnsiteDesignView
        design={resolveDesign(leadDesign, "ar")}
        device="desktop"
        frame="canvas"
        onClose={vi.fn()}
        onLead={onLead}
        words={{ consentRequired: "يرجى تحديد المربع للموافقة." }}
      />,
    );
    await userEvent.type(screen.getByLabelText(/Email/), "sara@example.com");
    await userEvent.click(screen.getByRole("button", { name: "Subscribe" }));
    expect(screen.getByRole("alert")).toHaveTextContent("يرجى تحديد المربع للموافقة.");
    expect(onLead).not.toHaveBeenCalled();
  });
});
