import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { CheckoutQuestion } from "../../types/checkout";
import { CheckoutQuestions } from "./CheckoutQuestions";

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
  { key: "gift", type: "CHECKBOX", label: "This is a gift", help: "We leave the prices out.", required: true },
];

describe("CheckoutQuestions", () => {
  it("renders nothing when the market asks nothing", () => {
    const { container } = render(<CheckoutQuestions questions={[]} answers={{}} onAnswer={vi.fn()} />);
    expect(container.innerHTML).toBe("");
  });

  it("shows each question type with the backend's labels, options and hints", () => {
    render(<CheckoutQuestions questions={QUESTIONS} answers={{ nationality: "IN" }} onAnswer={vi.fn()} />);

    expect(screen.getByRole("heading", { name: "A few more details" })).toBeTruthy();
    const select = screen.getByRole("combobox", { name: /Nationality/ }) as HTMLSelectElement;
    expect(select.required).toBe(true);
    expect(select.value).toBe("IN");
    expect([...select.options].map((o) => [o.value, o.text])).toEqual([
      ["", "Choose an option"],
      ["AE", "Emirati"],
      ["IN", "Indian"],
    ]);
    const help = document.getElementById(select.getAttribute("aria-describedby") ?? "");
    expect(help?.textContent).toBe("As on your passport.");

    const birthday = screen.getByLabelText(/Birthday/) as HTMLInputElement;
    expect(birthday.type).toBe("date");
    expect(birthday.required).toBe(false);

    const nickname = screen.getByRole("textbox", { name: /Nickname/ }) as HTMLInputElement;
    expect(nickname.maxLength).toBe(200);
    expect(nickname.required).toBe(false);

    const gift = screen.getByRole("checkbox", { name: /This is a gift/ }) as HTMLInputElement;
    expect(gift.required).toBe(true);
    expect(gift.checked).toBe(false);
    expect(document.getElementById(gift.getAttribute("aria-describedby") ?? "")?.textContent).toBe(
      "We leave the prices out.",
    );
  });

  it("marks only the optional questions as optional", () => {
    render(<CheckoutQuestions questions={QUESTIONS} answers={{}} onAnswer={vi.fn()} />);
    expect(screen.getByLabelText(/Birthday/).closest("label")?.textContent).toContain("(optional)");
    expect(screen.getByLabelText(/Nickname/).closest("label")?.textContent).toContain("(optional)");
    expect(screen.getByRole("combobox", { name: /Nationality/ }).closest("label")?.textContent).not.toContain(
      "(optional)",
    );
    expect(screen.getByRole("checkbox").closest("label")?.textContent).not.toContain("(optional)");
  });

  it("reports each answer by question key", () => {
    const onAnswer = vi.fn();
    render(<CheckoutQuestions questions={QUESTIONS} answers={{}} onAnswer={onAnswer} />);

    fireEvent.change(screen.getByRole("combobox", { name: /Nationality/ }), { target: { value: "AE" } });
    fireEvent.change(screen.getByLabelText(/Birthday/), { target: { value: "1990-04-02" } });
    fireEvent.change(screen.getByRole("textbox", { name: /Nickname/ }), { target: { value: "Sam" } });
    fireEvent.click(screen.getByRole("checkbox", { name: /This is a gift/ }));

    expect(onAnswer.mock.calls).toEqual([
      ["nationality", "AE"],
      ["birthday", "1990-04-02"],
      ["nickname", "Sam"],
      ["gift", "true"],
    ]);
  });

  it("unticking a box answers false", () => {
    const onAnswer = vi.fn();
    render(<CheckoutQuestions questions={QUESTIONS} answers={{ gift: "true" }} onAnswer={onAnswer} />);
    fireEvent.click(screen.getByRole("checkbox", { name: /This is a gift/ }));
    expect(onAnswer).toHaveBeenCalledWith("gift", "false");
  });
});
