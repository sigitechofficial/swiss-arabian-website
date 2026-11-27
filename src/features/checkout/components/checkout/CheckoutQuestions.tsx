"use client";

import { useId } from "react";
import { useShopCopy } from "@/lib/i18n/useShopCopy";
import { cbox, cboxGrid, cboxHead, fldCheck, fldFull, fldHint, fldSelect } from "@/styles/checkoutChrome";
import type { CheckoutAnswers, CheckoutQuestion } from "../../types/checkout";
import { TEXT_ANSWER_MAX } from "../../utils/checkoutQuestions";

type CheckoutQuestionsProps = {
  questions: readonly CheckoutQuestion[];
  answers: CheckoutAnswers;
  onAnswer: (key: string, value: string) => void;
};

/**
 * The market's checkout questions (admin: Checkout questions), between the
 * delivery address and the shipping method. Labels, options and hints arrive
 * in the shopper's language and are shown as given. Nothing renders when the
 * market asks nothing.
 */
export function CheckoutQuestions({ questions, answers, onAnswer }: CheckoutQuestionsProps) {
  const t = useShopCopy();
  if (questions.length === 0) return null;
  return (
    <section className={cbox} aria-labelledby="checkout-questions-title">
      <header className={cboxHead}>
        <h2 id="checkout-questions-title">{t("checkout.questions.title")}</h2>
      </header>
      <div className={cboxGrid}>
        {questions.map((question) => (
          <QuestionField
            key={question.key}
            question={question}
            value={answers[question.key] ?? ""}
            onChange={(value) => onAnswer(question.key, value)}
          />
        ))}
      </div>
    </section>
  );
}

function QuestionField({
  question,
  value,
  onChange,
}: {
  question: CheckoutQuestion;
  value: string;
  onChange: (value: string) => void;
}) {
  const t = useShopCopy();
  const helpId = useId();
  const name = `question-${question.key}`;
  const describedBy = question.help ? helpId : undefined;
  // `<small>`, not `<span>`: the field shell styles its direct spans as the label.
  const help = question.help ? (
    <small id={helpId} className={fldHint}>
      {question.help}
    </small>
  ) : null;

  if (question.type === "CHECKBOX") {
    return (
      <div className="col-span-full flex flex-col gap-1">
        <label className={fldCheck}>
          <input
            type="checkbox"
            name={name}
            required={question.required}
            aria-describedby={describedBy}
            checked={value === "true"}
            onChange={(event) => onChange(event.target.checked ? "true" : "false")}
          />
          <span>
            {question.label}
            {question.required ? null : <> <span className={fldHint}>{t("checkout.form.optional")}</span></>}
          </span>
        </label>
        {help}
      </div>
    );
  }

  const label = (
    <span>
      {question.label}
      {question.required ? null : <> <span className={fldHint}>{t("checkout.form.optional")}</span></>}
    </span>
  );

  if (question.type === "SELECT") {
    return (
      <label className={fldFull}>
        {label}
        <div className={fldSelect}>
          <select
            name={name}
            required={question.required}
            aria-describedby={describedBy}
            value={value}
            onChange={(event) => onChange(event.target.value)}
          >
            <option value="">{t("checkout.questions.choose")}</option>
            {(question.options ?? []).map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <b aria-hidden="true">▾</b>
        </div>
        {help}
      </label>
    );
  }

  return (
    <label className={fldFull}>
      {label}
      <input
        type={question.type === "DATE" ? "date" : "text"}
        name={name}
        required={question.required}
        maxLength={question.type === "TEXT" ? TEXT_ANSWER_MAX : undefined}
        aria-describedby={describedBy}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      {help}
    </label>
  );
}
