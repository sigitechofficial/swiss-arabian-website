import { englishTranslator, type Translator } from "./messages";

/**
 * The page's translator for code that runs outside React (API error toasts,
 * background bag sync). Set by `ShopLocaleProvider`; English until then.
 */
let current: Translator = englishTranslator;

export function setPageTranslator(t: Translator): void {
  current = t;
}

export function pageTranslator(): Translator {
  return current;
}
