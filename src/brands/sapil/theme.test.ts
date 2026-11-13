import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const css = fs.readFileSync(path.join(__dirname, "theme.css"), "utf8");

/** v9 :root tokens (assets/sapil-v9.css), name → value. */
const V9: Record<string, string> = {
  paper: "#f7f3ee", sand: "#efe8de", card: "#fffdfa", ink: "#1e1b18", "ink-2": "#4a443d",
  muted: "#6f665b" /* v9 #7a7166, darkened for contrast (see below) */, line: "#e4ddd2", "line-2": "#d6cdc0",
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

  it("keeps muted text at WCAG AA (4.5:1) on paper, sand and every pastel", () => {
    const lum = (hex: string) => {
      const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
      return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
    };
    const ratio = (a: string, b: string) => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05);
    for (const bg of ["paper", "sand", "card", ...Object.keys(V9).filter((n) => n.startsWith("p-"))])
      expect(ratio(V9.muted, V9[bg]), bg).toBeGreaterThanOrEqual(4.5);
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
    const order = [...css.matchAll(/@custom-variant max-(\d+) \{\s*@media \(max-width: (\d+)px\)/g)].map((m) => +m[2]);
    expect(order).toEqual([1280, 1100, 900, 760, 749, 600, 480]);
  });

  it("scopes the breakpoint variants to a Sapil subtree (beats the host's re-emitted base utilities)", () => {
    const scoped = css.match(/&:is\(\[data-brand="sapil"\] \*\) \{\s*@slot;/g) ?? [];
    expect(scoped).toHaveLength(7);
  });

  it("defines the eight keyframes, prefixed", () => {
    for (const k of ["bump", "dprog", "rise", "swing", "tick", "prog", "pop", "ship-shine"]) {
      expect(css).toContain(`@keyframes sapil-${k} {`);
      expect(css).toContain(`--animate-sapil-${k}:`);
    }
  });
});
