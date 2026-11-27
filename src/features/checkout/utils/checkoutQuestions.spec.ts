import { describe, expect, it } from "vitest";
import type { CheckoutQuestion } from "../types/checkout";
import { answersForSubmit, isAnswerMissing, questionSetKey, reconcileAnswers } from "./checkoutQuestions";

const nationality: CheckoutQuestion = {
  key: "nationality",
  type: "SELECT",
  label: "Nationality",
  help: null,
  required: true,
  options: [{ value: "AE", label: "Emirati" }],
};
const birthday: CheckoutQuestion = { key: "birthday", type: "DATE", label: "Birthday", help: null, required: false };
const gift: CheckoutQuestion = { key: "gift", type: "CHECKBOX", label: "Gift", help: null, required: true };

describe("reconcileAnswers", () => {
  it("prefills from the session, keeps what the shopper entered and drops questions no longer asked", () => {
    expect(
      reconcileAnswers([nationality, birthday], { nationality: "AE", birthday: "1990-01-01" }, {
        birthday: "2000-02-02",
        retired: "x",
      }),
    ).toEqual({ nationality: "AE", birthday: "2000-02-02" });
  });

  it("starts every question empty when nothing is saved", () => {
    expect(reconcileAnswers([nationality], undefined, {})).toEqual({ nationality: "" });
  });
});

describe("answersForSubmit", () => {
  it("sends one trimmed value per current question and a tick box as true / false", () => {
    expect(answersForSubmit([nationality, birthday, gift], { nationality: " AE ", other: "x" })).toEqual({
      nationality: "AE",
      birthday: "",
      gift: "false",
    });
    expect(answersForSubmit([gift], { gift: "true" })).toEqual({ gift: "true" });
  });
});

describe("isAnswerMissing", () => {
  it("needs a value for a required question and a tick for a required box", () => {
    expect(isAnswerMissing(nationality, "  ")).toBe(true);
    expect(isAnswerMissing(nationality, "AE")).toBe(false);
    expect(isAnswerMissing(birthday, "")).toBe(false);
    expect(isAnswerMissing(gift, "false")).toBe(true);
    expect(isAnswerMissing(gift, "true")).toBe(false);
  });
});

describe("questionSetKey", () => {
  it("changes with the session and with the questions", () => {
    const a = questionSetKey("s1", [nationality]);
    expect(questionSetKey("s1", [nationality])).toBe(a);
    expect(questionSetKey("s2", [nationality])).not.toBe(a);
    expect(questionSetKey("s1", [nationality, birthday])).not.toBe(a);
  });
});
