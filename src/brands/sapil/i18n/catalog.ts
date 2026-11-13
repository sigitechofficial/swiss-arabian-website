/**
 * Sapil's own wording, per area, on top of the shared messages (src/messages).
 *
 * One JSON file per area and language: `messages/<locale>/<area>.json`.
 * English defines every key; another language may leave keys out (English is
 * used). Keys are read as `"<area>.<key>"`, e.g. `t("common.tryAgain")`.
 *
 * To add an area: create `messages/en/<area>.json` (+ translations), import the
 * English file below and add it to `ENGLISH`. Adding a language needs no code:
 * its files are loaded by path.
 */
import common from "./messages/en/common.json";
import account from "./messages/en/account.json";
import bag from "./messages/en/bag.json";
import catalog from "./messages/en/catalog.json";
import checkout from "./messages/en/checkout.json";
import content from "./messages/en/content.json";
import home from "./messages/en/home.json";
import product from "./messages/en/product.json";
import shell from "./messages/en/shell.json";
import review from "./messages/en/review.json";
import offers from "./messages/en/offers.json";

export const ENGLISH = {
  common,
  shell,
  home,
  content,
  catalog,
  product,
  bag,
  checkout,
  account,
  review,
  offers,
} as const;

export type SapilArea = keyof typeof ENGLISH;
type AreaKeys<A extends SapilArea> = `${A}.${Extract<keyof (typeof ENGLISH)[A], string>}`;
export type SapilCopyKey = { [A in SapilArea]: AreaKeys<A> }[SapilArea];

export const AREAS = Object.keys(ENGLISH) as SapilArea[];
