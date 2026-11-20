import { englishTranslator, type MessageKey, type MessageValues, type Translator } from "./messages";

/**
 * A failure the browser finds itself (a rule checked before calling the
 * server), worded by a message key so the shopper reads it in the page's
 * language. `getUserFacingErrorMessage` translates it; `message` is the
 * English wording for logs and tests.
 */
export class KeyedError extends Error {
  readonly messageKey: MessageKey;
  readonly values?: MessageValues;

  constructor(messageKey: MessageKey, values?: MessageValues) {
    super(englishTranslator(messageKey, values));
    this.name = "KeyedError";
    this.messageKey = messageKey;
    this.values = values;
  }

  /** The sentence in the language of `t`. */
  translate(t: Translator): string {
    return t(this.messageKey, this.values);
  }
}
