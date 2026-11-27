import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { CheckoutQuestion } from "@/features/checkout/types/checkout";
import { loadSapilMessages } from "../../i18n/load";
import { SapilCopyProvider } from "../../i18n/SapilCopy";
import { QuestionsSection, questionFieldId } from "./CheckoutSections";

vi.mock("next/navigation", () => ({
  usePathname: () => "/checkout",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

async function renderIn(locale: "en" | "ar", ui: React.ReactNode) {
  const messages = await loadSapilMessages(locale);
  return render(<SapilCopyProvider messages={messages}>{ui}</SapilCopyProvider>);
}

const QUESTIONS: CheckoutQuestion[] = [
  {
    key: "nationality",
    type: "SELECT",
    label: "Nationality",
    help: "As on your passport.",
    required: true,
    options: [
      { value: "AE", label: "Emirati" },
      { value: "IN", label: "Indian" },
    ],
  },
  { key: "birthday", type: "DATE", label: "Birthday", help: null, required: false },
  { key: "nickname", type: "TEXT", label: "Nickname", help: null, required: false },
  { key: "terms", type: "CHECKBOX", label: "I agree", help: null, required: true },
];

describe("Sapil QuestionsSection", () => {
  it("renders nothing when the market asks nothing", async () => {
    const { container } = await renderIn("en", (
      <QuestionsSection questions={[]} answers={{}} onAnswer={vi.fn()} errors={{}} />
    ));
    expect(container.innerHTML).toBe("");
  });

  it("shows every question type in Sapil's fields, optional ones marked", async () => {
    await renderIn("en", <QuestionsSection questions={QUESTIONS} answers={{ nationality: "AE" }} onAnswer={vi.fn()} errors={{}} />);

    expect(screen.getByRole("heading", { name: "A few more details" })).toBeTruthy();
    const select = screen.getByRole("combobox", { name: "Nationality" }) as HTMLSelectElement;
    expect(select.id).toBe(questionFieldId("nationality"));
    expect(select.required).toBe(true);
    expect(select.value).toBe("AE");
    expect(select.options[0]?.text).toBe("Choose an option");
    expect(document.getElementById(select.getAttribute("aria-describedby") ?? "")?.textContent).toBe(
      "As on your passport.",
    );

    const birthday = screen.getByLabelText(/Birthday/) as HTMLInputElement;
    expect(birthday.type).toBe("date");
    expect(screen.getByText("Birthday").textContent).toContain("(optional)");
    const nickname = screen.getByRole("textbox", { name: /Nickname/ }) as HTMLInputElement;
    expect(nickname.maxLength).toBe(200);
    expect((screen.getByRole("checkbox", { name: "I agree" }) as HTMLInputElement).required).toBe(true);
  });

  it("shows the inline error under a question and keeps its hint described", async () => {
    await renderIn("en", (
      <QuestionsSection
        questions={QUESTIONS}
        answers={{}}
        onAnswer={vi.fn()}
        errors={{ nationality: "Answer this question to continue.", terms: "Tick this box to continue." }}
      />
    ));
    const select = screen.getByRole("combobox", { name: "Nationality" });
    expect(select.getAttribute("aria-invalid")).toBe("true");
    const described = (select.getAttribute("aria-describedby") ?? "").split(" ").map((id) => document.getElementById(id)?.textContent);
    expect(described).toEqual(["As on your passport.", "Answer this question to continue."]);
    const terms = screen.getByRole("checkbox", { name: "I agree" });
    expect(terms.getAttribute("aria-invalid")).toBe("true");
    expect(document.getElementById(terms.getAttribute("aria-describedby") ?? "")?.textContent).toBe(
      "Tick this box to continue.",
    );
  });

  it("reports answers by question key", async () => {
    const onAnswer = vi.fn();
    await renderIn("en", <QuestionsSection questions={QUESTIONS} answers={{}} onAnswer={onAnswer} errors={{}} />);
    fireEvent.change(screen.getByRole("combobox", { name: "Nationality" }), { target: { value: "IN" } });
    fireEvent.change(screen.getByLabelText(/Birthday/), { target: { value: "1990-04-02" } });
    fireEvent.change(screen.getByRole("textbox", { name: /Nickname/ }), { target: { value: "Sam" } });
    fireEvent.click(screen.getByRole("checkbox", { name: "I agree" }));
    expect(onAnswer.mock.calls).toEqual([
      ["nationality", "IN"],
      ["birthday", "1990-04-02"],
      ["nickname", "Sam"],
      ["terms", "true"],
    ]);
  });

  it("reads its own wording through the language files (English until a translation arrives)", async () => {
    const ar = await loadSapilMessages("ar");
    await renderIn("ar", <QuestionsSection questions={QUESTIONS.slice(0, 1)} answers={{}} onAnswer={vi.fn()} errors={{}} />);
    // The question itself comes translated from the backend and is shown as given.
    expect(screen.getByRole("combobox", { name: "Nationality" })).toBeTruthy();
    expect(screen.getByRole("heading").textContent).toBe(ar["checkout.sectionQuestions"] ?? "A few more details");
  });
});
