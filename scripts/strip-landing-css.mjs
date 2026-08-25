import { readFileSync, writeFileSync } from "node:fs";

const css = readFileSync("v5/_extract/landing.css", "utf8");
const stripped = css.replace(/url\(["']?data:[^)]+\)/g, "url()");
writeFileSync("v5/_extract/landing-clean.css", stripped);
console.log({ original: css.length, stripped: stripped.length });
