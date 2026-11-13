import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { loadSapilMessages } from "../../i18n/load";
import { SapilCopyProvider } from "../../i18n/SapilCopy";

const state = vi.hoisted(() => ({
  paymobFailed: false,
  threeDsCode: null as null | "cancelled" | "declined" | "unconfirmed",
  modalOpts: [] as unknown[],
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/checkout",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/features/checkout/hooks/useInlinePaymobCard", () => ({
  useInlinePaymobCard: () => ({ failed: state.paymobFailed }),
  submitCheckoutForm: vi.fn(),
}));
vi.mock("@/features/checkout/components/PaymobThreeDsModal", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/features/checkout/components/PaymobThreeDsModal")>()),
  usePaymobThreeDsModal: (_orderId: string, opts: unknown) => {
    state.modalOpts.push(opts);
    return { challengeErrorCode: state.threeDsCode, challengeError: "SWISS ARABIAN SENTENCE", overlay: null };
  },
}));

import { SapilInlinePayment, SapilTabbyCard } from "./SapilInlinePayment";
import { SapilThreeDsModal } from "./paymentParts";

async function renderIn(locale: "en" | "ar", ui: React.ReactNode) {
  const messages = await loadSapilMessages(locale);
  return render(<SapilCopyProvider messages={messages}>{ui}</SapilCopyProvider>);
}

const paymob = { provider: "paymob" as const, orderId: "o-1", clientSecret: "cs_test", publicKey: "pk_test" };

beforeEach(() => {
  state.paymobFailed = false;
  state.threeDsCode = null;
  state.modalOpts = [];
});

describe("Sapil inline payment", () => {
  it("Paymob card: Sapil's 3-D Secure overlay, Sapil wording, no Swiss Arabian sentence", async () => {
    state.threeDsCode = "declined";
    state.paymobFailed = true;
    await renderIn("en", <SapilInlinePayment session={paymob} />);
    expect(state.modalOpts[0]).toEqual({ Modal: SapilThreeDsModal });
    const alerts = screen.getAllByRole("alert").map((n) => n.textContent);
    expect(alerts).toContain("Your card was declined. Please try another card.");
    expect(alerts.some((a) => a?.startsWith("We couldn’t load the secure card form"))).toBe(true);
    expect(document.body.textContent).not.toMatch(/SWISS ARABIAN SENTENCE|Save this card/);
    expect(screen.getByText(/Card details go straight to Paymob/)).toBeTruthy();
    expect(document.getElementById("paymob-elements-inline")).not.toBeNull();
  });

  it("Paymob card in Arabic", async () => {
    state.threeDsCode = "cancelled";
    await renderIn("ar", <SapilInlinePayment session={paymob} />);
    expect(screen.getByRole("alert").textContent).toBe(
      "أُلغي التحقق من البطاقة. يمكنك المحاولة مرة أخرى بالبطاقة نفسها.",
    );
    expect(screen.getByText(/تذهب بيانات بطاقتك مباشرة إلى Paymob/)).toBeTruthy();
  });

  it("a session without keys shows Sapil's loading line", async () => {
    await renderIn("en", <SapilInlinePayment session={{ provider: "stripe", orderId: "o-1", clientSecret: "x" }} />);
    expect(screen.getByRole("status").textContent).toBe("Loading secure payment…");
  });
});

describe("SapilTabbyCard", () => {
  it("shows Tabby's standard wording when the market has no snippet settings", async () => {
    await renderIn("en", <SapilTabbyCard config={null} total={200} currency="AED" lang="en" />);
    expect(document.body.textContent).toContain("4 payments of AED 50.75/mo or up to 12 months.");
  });

  it("keeps Tabby's Arabic wording, right to left", async () => {
    await renderIn("ar", <SapilTabbyCard config={null} total={200} currency="AED" lang="ar" />);
    const line = screen.getByText(/4 دفعات بقيمة 50.75 AED/);
    expect(line.closest("[dir]")?.getAttribute("dir")).toBe("rtl");
  });
});

describe("SapilThreeDsModal", () => {
  it("opens the bank's page in a Sapil dialog with translated titles", async () => {
    HTMLDialogElement.prototype.showModal ??= function showModal(this: HTMLDialogElement) {
      this.setAttribute("open", "");
    };
    const frameRef = { current: null };
    await renderIn("ar", <SapilThreeDsModal src="https://acs.example.test/3ds" frameRef={frameRef} onFrameLoad={() => undefined} />);
    expect(screen.getByRole("heading").textContent).toBe("جارٍ تأكيد الدفع");
    expect(screen.getByTitle("التحقق من البطاقة لدى مصرفك").getAttribute("src")).toBe("https://acs.example.test/3ds");
    expect(document.body.style.overflow).toBe("hidden");
  });
});
