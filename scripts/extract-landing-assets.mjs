import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const root = process.cwd();
mkdirSync(join(root, "public/fonts"), { recursive: true });
mkdirSync(join(root, "public/assets"), { recursive: true });

for (const weight of [200, 300, 400, 500, 700, 900]) {
  const name = `benton-sans-wide-${weight}.ttf`;
  copyFileSync(join(root, "v5/fonts", name), join(root, "public/fonts", name));
}

for (const name of [
  "sa-logo-clear.png",
  "sa-logo.png",
  "bundles-hero.jpg",
  "bundle-mobile-hero.webp",
]) {
  copyFileSync(join(root, "v5/assets", name), join(root, "public/assets", name));
}

const html = readFileSync(join(root, "v5/landing.html"), "utf8");
const cards = [
  ...html.matchAll(
    /class="collection-card__art"[^>]*src="(data:image\/[^"]+)"/g,
  ),
];
cards.forEach((match, i) => {
  const dataUrl = match[1];
  const [, meta, b64] = dataUrl.match(/^data:([^;]+);base64,(.+)$/) ?? [];
  if (!b64) return;
  const ext = meta.includes("png") ? "png" : "jpg";
  writeFileSync(
    join(root, "public/assets", `collection-${i + 1}.${ext}`),
    Buffer.from(b64, "base64"),
  );
});

const hero = html.match(
  /\.hero__media\s*\{[\s\S]*?url\((data:image\/[^)]+)\)/,
);
if (hero) {
  const raw = hero[1].replace(/^["']|["']$/g, "");
  const [, , b64] = raw.match(/^data:([^;]+);base64,(.+)$/) ?? [];
  if (b64) {
    writeFileSync(
      join(root, "public/assets/hero.jpg"),
      Buffer.from(b64, "base64"),
    );
  }
}

console.log("copied fonts + assets", { collectionCards: cards.length });
