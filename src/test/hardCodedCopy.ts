import ts from "typescript";

/**
 * Finds shopper-facing English written into a component's source instead of a
 * message file (`src/messages/<locale>.json`): JSX text, prose in JSX
 * attributes (`aria-label`, `placeholder`, `alt`, `title`, props such as
 * `label="…"`), and sentences in string or template literals (toasts, error
 * fallbacks, `${count} products`).
 *
 * A source scan, so it is a heuristic: it skips what is code rather than copy
 * (imports, class names, comparisons, type literals, developer errors) and
 * callers allow-list the rest (brand names, provider-mandated texts) by text.
 */
export type HardCodedCopy = { line: number; text: string };

/** Attributes whose string values are code, never copy. */
const CODE_ATTRIBUTES = new Set([
  "className",
  "href",
  "src",
  "id",
  "key",
  "type",
  "role",
  "name",
  "htmlFor",
  "variant",
  "size",
  "as",
  "target",
  "rel",
  "autoComplete",
  "inputMode",
  "method",
  "action",
  "lang",
  "dir",
  "sizes",
  "tone",
  "align",
  "side",
  "mode",
  "layout",
  "icon",
  "fill",
  "stroke",
  "viewBox",
  "d",
  "pattern",
  "enterKeyHint",
  "loading",
  "decoding",
  "fetchPriority",
  "encType",
  "form",
  "list",
  "testId",
  "scope",
  "colorScheme",
]);

/** Calls whose arguments are developer text or code, never copy. */
const CODE_CALLS = /^(console\.\w+|require|import|cn|clsx|twMerge|cva|t|copy|useShopCopy|createTranslator|formatMessage|searchParams\.\w+|\w+\.(get|set|has|delete|append|startsWith|endsWith|includes|split|replace|replaceAll|match|test|join|indexOf|querySelector|querySelectorAll|getItem|setItem|removeItem|addEventListener|removeEventListener|toLocaleUpperCase|padStart|localeCompare))$/;

const LETTERS = /[A-Za-z]{2,}/;

/** Looks like words for a person, not an identifier, code, URL or class list. */
export function looksLikeProse(raw: string): boolean {
  const text = raw.replace(/\s+/g, " ").trim();
  if (!LETTERS.test(text)) return false;
  if (/^(https?:|mailto:|tel:|\/|#|\.|data:)/.test(text)) return false;
  // Identifiers, codes and keys: one token without spaces that is not a capitalised word.
  if (!/\s/.test(text)) {
    // "Subtotal", "Continue" — a single capitalised word is copy; "PENDING", "aria-label" are not.
    return /^[A-Z][a-z]+(?:[.!?:…]|\.\.\.)?$/.test(text) && !/^[A-Z][a-z]+[A-Z]/.test(text);
  }
  const tokens = text.split(" ");
  // Class lists and other code: every token has a dash, colon, slash, bracket or digit.
  const codeLike = (token: string) => /[-:/[\]_=@{}()<>]|\d/.test(token) && !/^[\d.,%]+$/.test(token);
  const words = tokens.filter((token) => /^[A-Za-z][A-Za-z'’]*[.,!?:;]?$/.test(token));
  if (words.length < 2 && !/^[A-Z][a-z]/.test(text)) return false;
  if (tokens.every(codeLike)) return false;
  // Two plain words in a row ("Order summary", "products in", "Choose Men").
  for (let i = 0; i + 1 < tokens.length; i += 1) {
    const a = tokens[i]!;
    const b = tokens[i + 1]!;
    if (/^[A-Za-z][A-Za-z'’]*[.,!?:;]?$/.test(a) && /^[A-Za-z][A-Za-z'’]*[.,!?:;…]?$/.test(b)) {
      return true;
    }
  }
  return /^[A-Z][a-z]+/.test(text) && words.length >= 1 && !tokens.every(codeLike);
}

function calleeName(expression: ts.Expression): string {
  if (ts.isIdentifier(expression)) return expression.text;
  if (ts.isPropertyAccessExpression(expression)) {
    return `${calleeName(expression.expression)}.${expression.name.text}`;
  }
  return "";
}

/** True when a literal at `node` is code rather than copy. */
function isCodePosition(node: ts.Node): boolean {
  let current: ts.Node = node;
  let parent = node.parent;
  while (parent) {
    if (ts.isImportDeclaration(parent) || ts.isExportDeclaration(parent)) return true;
    // Directives ("use client").
    if (ts.isExpressionStatement(parent) && parent.expression === node) return true;
    if (ts.isLiteralTypeNode(parent) || ts.isTypeNode(parent)) return true;
    if (ts.isCaseClause(parent) && parent.expression === current) return true;
    if (ts.isElementAccessExpression(parent) && parent.argumentExpression === current) return true;
    if ((ts.isPropertyAssignment(parent) || ts.isPropertySignature(parent)) && parent.name === current) {
      return true;
    }
    if (ts.isBinaryExpression(parent)) {
      const op = parent.operatorToken.kind;
      if (
        op === ts.SyntaxKind.EqualsEqualsEqualsToken ||
        op === ts.SyntaxKind.ExclamationEqualsEqualsToken ||
        op === ts.SyntaxKind.EqualsEqualsToken ||
        op === ts.SyntaxKind.ExclamationEqualsToken ||
        op === ts.SyntaxKind.InKeyword
      ) {
        return true;
      }
    }
    if (ts.isNewExpression(parent) && /Error$/.test(calleeName(parent.expression))) return true;
    if (ts.isCallExpression(parent) && parent.expression !== current) {
      if (CODE_CALLS.test(calleeName(parent.expression))) return true;
    }
    if (ts.isJsxAttribute(parent)) {
      const name = parent.name.getText();
      return CODE_ATTRIBUTES.has(name) || name.startsWith("data-") || /Class(Name)?$/.test(name);
    }
    if (ts.isVariableDeclaration(parent) || ts.isPropertyAssignment(parent)) {
      const name = parent.name.getText();
      if (/(class|classes|className|Cls|Style|style|Href|href|Url|url|Key|key|Id|Path|path|Pattern|Selector)$/i.test(name)) {
        return true;
      }
    }
    if (ts.isBlock(parent) || ts.isSourceFile(parent)) return false;
    current = parent;
    parent = parent.parent;
  }
  return false;
}

export function findHardCodedCopy(source: string, fileName = "component.tsx"): HardCodedCopy[] {
  const file = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const found: HardCodedCopy[] = [];
  const report = (node: ts.Node, text: string) => {
    const { line } = file.getLineAndCharacterOfPosition(node.getStart(file));
    found.push({ line: line + 1, text: text.replace(/\s+/g, " ").trim() });
  };

  const visit = (node: ts.Node) => {
    if (ts.isJsxText(node)) {
      const text = node.text.replace(/\s+/g, " ").trim();
      if (LETTERS.test(text)) report(node, text);
    } else if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      if (looksLikeProse(node.text) && !isCodePosition(node)) report(node, node.text);
    } else if (ts.isTemplateExpression(node)) {
      const parts = [node.head.text, ...node.templateSpans.map((span) => span.literal.text)];
      const joined = parts.join(" {} ");
      if (!isCodePosition(node) && parts.some((part) => looksLikeProse(part) || /\s[a-z]{3,}\b(?![-:/])/.test(` ${part}`) && looksLikeProse(`x ${part}`))) {
        report(node, joined);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(file);
  return found;
}
