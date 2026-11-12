import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const css = fs.readFileSync(path.join(__dirname, "theme.css"), "utf8");

/** v9 :root tokens (assets/sapil-v9.css), name → value. */
const V9: Record<string, string> = {
  paper: "#f7f3ee", sand: "#efe8de", card: "#fffdfa", ink: "#1e1b18", "ink-2": "#4a443d",
  muted: "#7a7166", line: "#e4ddd2", "line-2": "#d6cdc0",
  accent: "#16305c", "accent-2": "#22447d", "accent-soft": "#e7ebf3",
  "p-pink": "#fbe5ee", "p-peach": "#fdebe1", "p-butter": "#fff3d4", "p-mint": "#dff3ea", "p-sky": "#e2edfb",
  "p-lilac": "#eee6fb", "p-sand": "#f4ece1", "p-sage": "#e9efe1", "p-lime": "#f0f7d4",
  ok: "#1f7a4d", "ok-2": "#2bb58a", "ok-soft": "#d9f2e6", star: "#b8790f", rose: "#a8476f",
  "rose-2": "#f2a7c4", sale: "#9a3b2a", "on-dark": "#cfc8bd",
  r: "16px", "r-sm": "10px", wrap: "1440px", gut: "24px",
};

describe("Sapil theme tokens", () => {
  it.each(Object.entries(V9))("--sapil-%s matches v9", (name, value) => {
    expect(css).toMatch(new RegExp(`--sapil-${name}:\\s*${value};`));
  });

  it("scopes raw tokens to [data-brand=sapil], never :root", () => {
    expect(css).toContain('[data-brand="sapil"] {');
    expect(css).not.toMatch(/(^|\n)\s*:root\s*\{/);
  });

  it("maps every colour into Tailwind with a sapil- prefix (inline theme)", () => {
    expect(css).toContain("@theme inline {");
    for (const name of Object.keys(V9).filter((n) => n.startsWith("p-") || ["ink", "accent", "paper"].includes(n)))
      expect(css).toContain(`--color-sapil-${name}: var(--sapil-${name});`);
  });

  it("has the desktop-down breakpoints, largest first", () => {
    const order = [...css.matchAll(/@custom-variant max-(\d+) \(@media \(max-width: (\d+)px\)\)/g)].map((m) => +m[2]);
    expect(order).toEqual([1280, 1100, 900, 760, 749, 600, 480]);
  });

  it("defines the eight keyframes, prefixed", () => {
    for (const k of ["bump", "dprog", "rise", "swing", "tick", "prog", "pop", "ship-shine"]) {
      expect(css).toContain(`@keyframes sapil-${k} {`);
      expect(css).toContain(`--animate-sapil-${k}:`);
    }
  });
});
