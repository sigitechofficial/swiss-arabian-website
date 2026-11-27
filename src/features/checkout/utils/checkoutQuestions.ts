import type { CheckoutAnswers, CheckoutQuestion } from "../types/checkout";

/** Longest one-line (TEXT) answer the backend stores. */
export const TEXT_ANSWER_MAX = 200;

/** Identifies a question set: a new session or a changed set of questions re-reads the saved answers. */
export function questionSetKey(sessionId: string | null | undefined, questions: readonly CheckoutQuestion[]): string {
  return `${sessionId ?? ""}|${questions.map((q) => `${q.key}:${q.type}`).join(",")}`;
}

/**
 * The form's answers for the current questions: what the shopper already
 * entered wins, then what the session has saved, else nothing. Answers to
 * questions the market no longer asks are dropped (the backend refuses
 * unknown keys).
 */
export function reconcileAnswers(
  questions: readonly CheckoutQuestion[],
  saved: CheckoutAnswers | null | undefined,
  current: CheckoutAnswers,
): CheckoutAnswers {
  const next: CheckoutAnswers = {};
  for (const question of questions) {
    const typed = current[question.key];
    next[question.key] = typed ? typed : (saved?.[question.key] ?? "");
  }
  return next;
}

/**
 * What is sent to `POST …/answers`: one value per current question. A tick
 * box sends what it shows ("true" / "false"); other questions send the
 * trimmed value, an empty string meaning no answer.
 */
export function answersForSubmit(
  questions: readonly CheckoutQuestion[],
  answers: CheckoutAnswers | null | undefined,
): CheckoutAnswers {
  const out: CheckoutAnswers = {};
  for (const question of questions) {
    const value = (answers?.[question.key] ?? "").trim();
    out[question.key] = question.type === "CHECKBOX" ? (value === "true" ? "true" : "false") : value;
  }
  return out;
}

/** Whether a question still needs an answer before the order can be placed. */
export function isAnswerMissing(question: CheckoutQuestion, value: string | null | undefined): boolean {
  if (!question.required) return false;
  const answer = (value ?? "").trim();
  return question.type === "CHECKBOX" ? answer !== "true" : answer === "";
}
