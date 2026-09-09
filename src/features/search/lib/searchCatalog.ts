import {
  CATALOG_PRODUCTS,
  COLLECTION_LABELS,
  NOTE_LABELS,
  type CatalogProduct,
} from "@/features/catalog/constants/catalogProducts";

/** Short filler words that would otherwise dilute token match scores. */
const STOPWORDS = new Set([
  "i",
  "im",
  "i'm",
  "looking",
  "for",
  "a",
  "an",
  "the",
  "to",
  "of",
  "and",
  "or",
  "with",
  "scent",
  "fragrance",
  "perfume",
  "something",
  "some",
  "my",
  "me",
  "want",
  "need",
  "like",
  "please",
  "that",
  "this",
  "in",
  "on",
  "at",
  "is",
  "it",
]);

/** Common misspellings for house names / notes — applied before fuzzy scoring. */
const ALIASES: Record<string, string> = {
  shagaf: "shaghaf",
  shagaff: "shaghaf",
  shagaaf: "shaghaf",
  shaghf: "shaghaf",
  shagafh: "shaghaf",
  vanila: "vanilla",
  vanillia: "vanilla",
  patcholi: "patchouli",
  patchouly: "patchouli",
  incence: "incense",
  insense: "incense",
  tabacco: "tobacco",
  tobbaco: "tobacco",
  ahmer: "ahmar",
  azrak: "azraq",
  aswod: "aswad",
};

export type RankedCatalogHit = CatalogProduct & { searchScore: number };

function normalize(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9\u0600-\u06FF]+/gi, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function wordsOf(value: string): string[] {
  return normalize(value).split(" ").filter(Boolean);
}

function tokensOf(query: string): string[] {
  return wordsOf(query)
    .map((tok) => ALIASES[tok] ?? tok)
    .filter((tok) => !STOPWORDS.has(tok));
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const rows = a.length + 1;
  const cols = b.length + 1;
  const prev = new Array<number>(cols);
  const curr = new Array<number>(cols);
  for (let j = 0; j < cols; j++) prev[j] = j;

  for (let i = 1; i < rows; i++) {
    curr[0] = i;
    for (let j = 1; j < cols; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    for (let j = 0; j < cols; j++) prev[j] = curr[j]!;
  }
  return prev[b.length]!;
}

function maxEdits(len: number): number {
  if (len <= 1) return 0;
  if (len <= 3) return 1;
  if (len <= 6) return 2;
  return 3;
}

/** Predictive prefix + typo-tolerant token-to-word match. */
function tokenScoreAgainstWord(token: string, word: string): number {
  if (!token || !word) return 0;
  if (word === token) return 120;
  if (word.startsWith(token)) return 90 + Math.min(token.length, 10);
  if (token.length >= 3 && word.includes(token)) return 55;
  if (token.length >= 3 && token.startsWith(word) && word.length >= 3) return 45;

  const dist = levenshtein(token, word);
  const allowed = maxEdits(Math.max(token.length, word.length));
  if (dist > 0 && dist <= allowed) {
    if (token.length <= 2 && dist > 0 && token[0] !== word[0]) return 0;
    return 40 - dist * 8;
  }
  return 0;
}

function bestWordScore(token: string, words: string[]): number {
  let best = 0;
  for (const word of words) {
    best = Math.max(best, tokenScoreAgainstWord(token, word));
  }
  return best;
}

function searchableFields(product: CatalogProduct) {
  const title = product.title;
  const subtitle = product.subtitle ?? "";
  const note = NOTE_LABELS[product.note] ?? product.note;
  const collection = COLLECTION_LABELS[product.collection] ?? product.collection;
  return {
    titleWords: wordsOf(title),
    titleJoined: normalize(title).replace(/ /g, ""),
    otherWords: wordsOf([subtitle, note, collection, product.slug, product.id].join(" ")),
  };
}

function scoreProduct(product: CatalogProduct, tokens: string[], rawQuery: string): number {
  const fields = searchableFields(product);
  const titleNorm = normalize(product.title);
  const queryNorm = normalize(rawQuery);

  let score = 0;

  if (queryNorm && titleNorm.startsWith(queryNorm)) score += 200;
  else if (queryNorm.length >= 3 && titleNorm.includes(queryNorm)) score += 140;

  const queryJoined = queryNorm.replace(/ /g, "");
  if (queryJoined.length >= 4 && fields.titleJoined.startsWith(queryJoined)) score += 110;
  else if (queryJoined.length >= 4 && levenshtein(queryJoined, fields.titleJoined) <= maxEdits(queryJoined.length)) {
    score += 70;
  }

  for (const token of tokens) {
    const titleHit = bestWordScore(token, fields.titleWords);
    const otherHit = bestWordScore(token, fields.otherWords);
    if (titleHit === 0 && otherHit === 0) {
      // One unmatched token is allowed if others scored on the name —
      // still penalize so "rose oud" doesn't rank a vanilla-only hit first.
      score -= 15;
      continue;
    }
    score += titleHit * 1.35 + otherHit * 0.45;
  }

  return score;
}

export function searchCatalog(
  query: string,
  options?: { limit?: number },
): RankedCatalogHit[] {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const tokens = tokensOf(trimmed);
  if (!tokens.length) return [];

  const ranked: RankedCatalogHit[] = [];
  for (const product of CATALOG_PRODUCTS) {
    const searchScore = scoreProduct(product, tokens, trimmed);
    if (searchScore >= 40) ranked.push({ ...product, searchScore });
  }

  ranked.sort((a, b) => b.searchScore - a.searchScore || a.title.localeCompare(b.title));
  return options?.limit ? ranked.slice(0, options.limit) : ranked;
}

/** Default overlay list before the shopper types — bestsellers by catalog sales. */
export function previewCatalog(limit = 8): RankedCatalogHit[] {
  return [...CATALOG_PRODUCTS]
    .sort((a, b) => b.sales - a.sales)
    .slice(0, limit)
    .map((product) => ({ ...product, searchScore: 0 }));
}
