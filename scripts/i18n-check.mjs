#!/usr/bin/env node
/**
 * npm run i18n:check [-- --root <website folder>]
 *
 * Checks every language file against English, with the rules the backend
 * translation pack import uses:
 *   - src/messages/<locale>.json against en.json;
 *   - each brand's own storefront texts,
 *     src/brands/<brand>/i18n/messages/<locale>/<area>.json against en/<area>.json;
 *   - src/lib/i18n/translation-approvals.json names only texts that exist.
 * Errors (exit code 1): a key English does not have, an area English does not
 * have, a plain text where English has plural forms (or the other way round), a
 * plural form name other than zero/one/two/few/many/other, a plural without
 * `other`, {placeholders} that differ from English.
 * Warnings: plural forms the language needs (Intl.PluralRules) but the file
 * leaves out (they read `other`). Information: keys left to English.
 * Translators normally change these files through the backend translation pack
 * (backend docs/translation/README.md).
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PLURAL_FORMS = ["zero", "one", "two", "few", "many", "other"];
const LOCALE_FILE = /^[a-z]{2,3}(-[a-z0-9]{2,8})*\.json$/;
const LOCALE = /^[a-z]{2,3}(-[a-z0-9]{2,8})*$/;

/** Keys a translation may give an extra slot the code fills for every language (with the reason). */
const EXTRA_SLOTS_ALLOWED = {
  // The page passes {label} too; the Arabic wording names the link itself.
  "promo.viewAllBenefits": ["label"],
};

const has = (object, key) => object !== null && typeof object === "object" && Object.hasOwn(object, key);
const isObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const isPlural = (value) => isObject(value) && Object.keys(value).every((key) => PLURAL_FORMS.includes(key));

const slotsOf = (value) =>
  [...new Set([...JSON.stringify(value).matchAll(/\{(\w+)\}/g)].map((match) => match[1]))].sort();

/** A file's data; an editor's byte order mark is ignored. */
const readJson = (file) => JSON.parse(readFileSync(file, "utf8").replace(/^﻿/, ""));

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
    if (!has(english, key)) {
      errors.push(`${key}: not an English key`);
      continue;
    }
    const reference = english[key];
    if (isObject(value)) {
      const unknown = Object.keys(value).filter((form) => !PLURAL_FORMS.includes(form));
      if (unknown.length) {
        errors.push(`${key}: unknown plural form ${unknown.join(", ")} (plural forms are ${PLURAL_FORMS.join(", ")})`);
        continue;
      }
    }
    if (isPlural(reference) !== isPlural(value) || (typeof value !== "string" && !isPlural(value))) {
      errors.push(`${key}: ${isPlural(reference) ? "needs plural forms" : "must be one text"} like English`);
      continue;
    }
    // A plural form may say the number in words ("منتج واحد"): {count} is optional there.
    const comparable = (names) => (isPlural(value) ? names.filter((name) => name !== "count") : names);
    const allowed = has(EXTRA_SLOTS_ALLOWED, key) ? EXTRA_SLOTS_ALLOWED[key] : [];
    const want = comparable(slotsOf(reference));
    const got = comparable(slotsOf(value)).filter((name) => !allowed.includes(name) || want.includes(name));
    if (want.join() !== got.join()) {
      errors.push(`${key}: placeholders {${got.join("}, {")}} differ from English {${want.join("}, {")}}`);
    }
    if (isPlural(value)) {
      if (typeof value.other !== "string" || !value.other.trim()) errors.push(`${key}: plural forms need "other"`);
      const missing = pluralFormsOf(locale).filter((form) => form !== "other" && !(has(value, form) && value[form].trim()));
      if (missing.length) warnings.push(`${key}: plural forms missing for ${locale}: ${missing.join(", ")} (they read "other")`);
    }
  }
  const missing = Object.keys(english).filter((key) => !has(messages, key));
  return { errors, warnings, missing };
}

function checked(name, locale, read) {
  try {
    return { name, ...read() };
  } catch (error) {
    return { name, errors: [`not valid JSON: ${error.message}`], warnings: [], missing: [] };
  }
}

/** Checks every <locale>.json next to en.json in `dir`. */
export function checkMessageFolder(dir) {
  const english = readJson(path.join(dir, "en.json"));
  return readdirSync(dir)
    .filter((name) => LOCALE_FILE.test(name) && name !== "en.json")
    .sort()
    .map((name) => {
      const locale = name.replace(/\.json$/, "");
      return { locale, ...checked(name, locale, () => checkMessages(english, readJson(path.join(dir, name)), locale)) };
    });
}

/**
 * Checks a brand's storefront texts: every <locale>/<area>.json in `dir`
 * against en/<area>.json. One result per language and area.
 */
export function checkBrandFolder(dir) {
  const englishDir = path.join(dir, "en");
  const areas = readdirSync(englishDir).filter((name) => name.endsWith(".json"));
  const out = [];
  for (const locale of readdirSync(dir).filter((name) => name !== "en" && statSync(path.join(dir, name)).isDirectory()).sort()) {
    if (!LOCALE.test(locale)) {
      out.push({ locale, name: locale, errors: [`"${locale}" is not a lower-case language code`], warnings: [], missing: [] });
      continue;
    }
    for (const name of readdirSync(path.join(dir, locale)).sort()) {
      if (!areas.includes(name)) {
        out.push({ locale, name, errors: [`${name}: no such area in English`], warnings: [], missing: [] });
        continue;
      }
      out.push({
        locale,
        ...checked(name, locale, () =>
          checkMessages(readJson(path.join(englishDir, name)), readJson(path.join(dir, locale, name)), locale),
        ),
      });
    }
  }
  return out;
}

/** Brand folders with storefront texts of their own: { brand, dir }. */
export function brandMessageFolders(root) {
  const brands = path.join(root, "src", "brands");
  if (!existsSync(brands)) return [];
  return readdirSync(brands)
    .sort()
    .map((brand) => ({ brand, dir: path.join(brands, brand, "i18n", "messages") }))
    .filter(({ dir }) => existsSync(path.join(dir, "en")));
}

/** Ids in translation-approvals.json that name no English text. */
export function checkApprovals(root) {
  const file = path.join(root, "src", "lib", "i18n", "translation-approvals.json");
  if (!existsSync(file)) return [];
  const site = readJson(path.join(root, "src", "messages", "en.json"));
  const brands = Object.fromEntries(brandMessageFolders(root).map(({ brand, dir }) => [brand, path.join(dir, "en")]));
  const exists = (id) => {
    const parts = id.split(":");
    if (parts[0] !== "site") return false;
    if (parts.length === 2) return has(site, parts[1]);
    const [, brand, area, ...rest] = parts;
    const english = has(brands, brand) ? path.join(brands[brand], `${area}.json`) : null;
    return Boolean(english && existsSync(english) && has(readJson(english), rest.join(":")));
  };
  const errors = [];
  for (const approval of readJson(file).approvals ?? []) {
    for (const id of approval.keys ?? []) if (!exists(id)) errors.push(`${id} (approval by ${approval.by}): no such text`);
  }
  return errors;
}

/** Every check for the website at `root`. */
export function checkWebsite(root) {
  return {
    messages: checkMessageFolder(path.join(root, "src", "messages")),
    brands: brandMessageFolders(root).map(({ brand, dir }) => ({ brand, results: checkBrandFolder(dir) })),
    approvals: checkApprovals(root),
  };
}

function print(label, result) {
  console.log(`${label}: ${result.errors.length} errors, ${result.warnings.length} warnings, ${result.missing.length} keys left to English`);
  for (const error of result.errors) console.log(`  error   ${error}`);
  for (const warning of result.warnings) console.log(`  warning ${warning}`);
  if (result.missing.length) console.log(`  english ${result.missing.join(", ")}`);
  return result.errors.length > 0;
}

function main() {
  const args = process.argv.slice(2);
  const at = args.indexOf("--root");
  const root = at >= 0 && args[at + 1] ? path.resolve(args[at + 1]) : path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const result = checkWebsite(root);
  let failed = false;
  for (const file of result.messages) failed = print(`src/messages/${file.locale}.json`, file) || failed;
  for (const { brand, results } of result.brands) {
    for (const file of results) failed = print(`src/brands/${brand}/i18n/messages/${file.locale}/${file.name}`, file) || failed;
  }
  for (const error of result.approvals) console.log(`  error   translation-approvals.json: ${error}`);
  failed ||= result.approvals.length > 0;
  process.exitCode = failed ? 1 : 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
