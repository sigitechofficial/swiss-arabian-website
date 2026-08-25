import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const stylesDir = join(root, "src/styles");
mkdirSync(stylesDir, { recursive: true });
mkdirSync(join(root, "public/assets"), { recursive: true });

writeFileSync(
  join(stylesDir, "v5-fonts.css"),
  `/* Benton Sans Wide — local brand webfont from v5. */

@font-face {
  font-family: "Benton Sans Wide";
  src: url("/fonts/benton-sans-wide-200.ttf") format("truetype");
  font-weight: 200;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: "Benton Sans Wide";
  src: url("/fonts/benton-sans-wide-300.ttf") format("truetype");
  font-weight: 300;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: "Benton Sans Wide";
  src: url("/fonts/benton-sans-wide-400.ttf") format("truetype");
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: "Benton Sans Wide";
  src: url("/fonts/benton-sans-wide-500.ttf") format("truetype");
  font-weight: 500;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: "Benton Sans Wide";
  src: url("/fonts/benton-sans-wide-700.ttf") format("truetype");
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: "Benton Sans Wide";
  src: url("/fonts/benton-sans-wide-900.ttf") format("truetype");
  font-weight: 900;
  font-style: normal;
  font-display: swap;
}
`,
);

const clean = readFileSync(join(root, "v5/_extract/landing-clean.css"), "utf8");
const lines = clean.split(/\r?\n/);
// tokens + primitives + landing sections (not fonts, reset, or nav-light duplicate)
const landing = `${lines.slice(162, 1893).join("\n")}\n`
  .replace(
    /url\(\) right center \/ cover no-repeat/g,
    'url("/assets/hero.jpg") right center / cover no-repeat',
  )
  .replace(
    /url\(\) center \/ cover no-repeat/g,
    'url("/assets/hero.jpg") center / cover no-repeat',
  );

writeFileSync(
  join(stylesDir, "v5-landing.css"),
  `/* Generated from v5/_extract/landing-clean.css — tokens, primitives, landing sections. */\n${landing}`,
);

copyFileSync(join(root, "v5/chrome.css"), join(stylesDir, "v5-chrome.css"));

function writeHeroFrom(sourcePath) {
  const source = readFileSync(sourcePath, "utf8");
  const match =
    source.match(
      /\.hero__media\s*\{[\s\S]*?url\((["']?)(data:image\/[^)"']+)\1\)/,
    ) ?? source.match(/url\((["']?)(data:image\/jpeg;base64,[^)"']+)\1\)/);
  if (!match) return false;
  const raw = match[2];
  const parsed = raw.match(/^data:([^;]+);base64,(.+)$/);
  if (!parsed) return false;
  writeFileSync(join(root, "public/assets/hero.jpg"), Buffer.from(parsed[2], "base64"));
  return true;
}

const heroOk =
  writeHeroFrom(join(root, "v5/_extract/landing.css")) ||
  writeHeroFrom(join(root, "v5/landing.html"));

console.log("prepared v5 styles", { hero: heroOk });
