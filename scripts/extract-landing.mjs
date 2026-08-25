import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const html = readFileSync("v5/landing.html", "utf8");
const styles = [...html.matchAll(/<style>([\s\S]*?)<\/style>/g)].map((m) => m[1]);
mkdirSync("v5/_extract", { recursive: true });
writeFileSync("v5/_extract/landing.css", styles.join("\n\n/* ===== next style block ===== */\n\n"));

const main = html.match(/<main[\s\S]*?<\/main>/);
if (!main) throw new Error("main not found");
const stripped = main[0]
  .replace(/src="data:[^"]+"/g, 'src=""')
  .replace(/url\(data:[^)]+\)/g, "url()");
writeFileSync("v5/_extract/landing-main.html", stripped);

const header = readFileSync("v5/partials/header.html", "utf8");
writeFileSync(
  "v5/_extract/header.html",
  header.replace(/src="data:[^"]+"/g, 'src=""'),
);

console.log({
  styleBlocks: styles.length,
  cssChars: styles.join("").length,
  mainChars: stripped.length,
});
