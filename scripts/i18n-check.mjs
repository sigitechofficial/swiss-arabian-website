#!/usr/bin/env node
/**
 * npm run i18n:check [-- --dir <messages folder>]
 *
 * Checks every language file in src/messages against English (en.json), the
 * same rules the backend translation pack import uses:
 *   - errors (exit code 1): a key English does not have, a plain text where
 *     English has plural forms (or the other way round), {placeholders} that
 *     differ from English, a plural without its `other` form;
 *   - warnings: plural forms the language needs (Intl.PluralRules) but the file
 *     leaves out (they read `other`);
 *   - information: keys the file leaves out (they read English).
 * Translators normally change these files through the backend translation pack
 * (backend docs/translation/README.md).
 */
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PLURAL_FORMS = ["zero", "one", "two", "few", "many", "other"];

/** Keys a translation may give an extra slot the code fills for every language (with the reason). */
const EXTRA_SLOTS_ALLOWED = {
  // The page passes {label} too; the Arabic wording names the link itself.
  "promo.viewAllBenefits": ["label"],
};

const isPlural = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value) && Object.keys(value).every((key) => PLURAL_FORMS.includes(key));

const slotsOf = (value) =>
  [...new Set([...JSON.stringify(value).matchAll(/\{(\w+)\}/g)].map((match) => match[1]))].sort();

function pluralFormsOf(locale) {
  try {
    const found = new Intl.PluralRules(locale).resolvedOptions().pluralCategories;
    return PLURAL_FORMS.filter((form) => found.includes(form));
  } catch {
    return ["one", "other"];
  }
}

/** Problems of one language file, compared with English. */
export function checkMessages(english, messages, locale) {
  const errors = [];
  const warnings = [];
  for (const [key, value] of Object.entries(messages)) {
    if (key === "$comment") continue;
    if (!(key in english)) {
      errors.push(`${key}: not an English key`);
      continue;
    }
    const reference = english[key];
    if (isPlural(reference) !== isPlural(value) || (typeof value !== "string" && !isPlural(value))) {
      errors.push(`${key}: ${isPlural(reference) ? "needs plural forms" : "must be one text"} like English`);
      continue;
    }
    // A plural form may say the number in words ("منتج واحد"): {count} is optional there.
    const comparable = (names) => (isPlural(value) ? names.filter((name) => name !== "count") : names);
    const allowed = EXTRA_SLOTS_ALLOWED[key] ?? [];
    const want = comparable(slotsOf(reference));
    const got = comparable(slotsOf(value)).filter((name) => !allowed.includes(name) || want.includes(name));
    if (want.join() !== got.join()) {
      errors.push(`${key}: placeholders {${got.join("}, {")}} differ from English {${want.join("}, {")}}`);
    }
    if (isPlural(value)) {
      if (typeof value.other !== "string" || !value.other.trim()) errors.push(`${key}: plural forms need "other"`);
      const missing = pluralFormsOf(locale).filter((form) => !value[form]?.trim());
      if (missing.length) warnings.push(`${key}: plural forms missing for ${locale}: ${missing.join(", ")} (they read "other")`);
    }
  }
  const missing = Object.keys(english).filter((key) => !(key in messages));
  return { errors, warnings, missing };
}

/** Checks every <locale>.json next to en.json in `dir`. */
export function checkMessageFolder(dir) {
  const read = (name) => JSON.parse(readFileSync(path.join(dir, name), "utf8"));
  const english = read("en.json");
  return readdirSync(dir)
    .filter((name) => /^[a-z]{2,3}(-[a-z0-9]{2,8})*\.json$/.test(name) && name !== "en.json")
    .sort()
    .map((name) => {
      const locale = name.replace(/\.json$/, "");
      try {
        return { locale, ...checkMessages(english, read(name), locale) };
      } catch (error) {
        return { locale, errors: [`not valid JSON: ${error.message}`], warnings: [], missing: [] };
      }
    });
}

function main() {
  const args = process.argv.slice(2);
  const at = args.indexOf("--dir");
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const dir = at >= 0 && args[at + 1] ? path.resolve(args[at + 1]) : path.join(root, "src", "messages");
  let failed = false;
  for (const result of checkMessageFolder(dir)) {
    console.log(
      `${result.locale}.json: ${result.errors.length} errors, ${result.warnings.length} warnings, ${result.missing.length} keys left to English`,
    );
    for (const error of result.errors) console.log(`  error   ${error}`);
    for (const warning of result.warnings) console.log(`  warning ${warning}`);
    if (result.missing.length) console.log(`  english ${result.missing.join(", ")}`);
    failed ||= result.errors.length > 0;
  }
  process.exitCode = failed ? 1 : 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
