import { Fragment, type ReactNode } from "react";

const MARK = "\u0000";

/**
 * A translated sentence with some placeholders replaced by elements (links),
 * so the whole sentence stays one message in every language (word order is the
 * translator's). Pass the translator's output made with `linkSlots(names)`.
 */
export function TextWithLinks({
  text,
  links,
}: {
  text: string;
  links: Record<string, ReactNode>;
}) {
  const parts = text.split(MARK);
  return (
    <>
      {parts.map((part, index) =>
        index % 2 === 1 && part in links ? (
          <Fragment key={index}>{links[part]}</Fragment>
        ) : (
          <Fragment key={index}>{part}</Fragment>
        ),
      )}
    </>
  );
}

/** Placeholder values that `TextWithLinks` turns back into elements. */
export function linkSlots<K extends string>(names: readonly K[]): Record<K, string> {
  return Object.fromEntries(names.map((name) => [name, `${MARK}${name}${MARK}`])) as Record<
    K,
    string
  >;
}
