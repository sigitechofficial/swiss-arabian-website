import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * A bare `1fr` grid track has a minimum of `auto`: a wide child (a scrolling
 * rail, a long order number or email) stretches the column and the whole page
 * sideways on a phone. Every flexible track in Sapil is `minmax(0,Nfr)`.
 * (Found on the bag page: the picks rail widened it to 1,172px at 375px.)
 */
const ROOT = __dirname;
const GRID = /grid-cols-\[([^\]]+)\]/g;
const BARE_FR = /^\d*\.?\d+fr$/;

function sources(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === "__snapshots__" ? [] : sources(full);
    return /\.tsx?$/.test(entry.name) && !/\.(test|spec)\./.test(entry.name) ? [full] : [];
  });
}

function topLevelTracks(template: string): string[] {
  const tracks: string[] = [];
  let depth = 0;
  let current = "";
  for (const ch of template) {
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (ch === "_" && depth === 0) {
      tracks.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  tracks.push(current);
  return tracks;
}

describe("Sapil grid tracks", () => {
  it("never uses a bare fr track (use minmax(0,Nfr))", () => {
    const offenders = sources(ROOT).flatMap((file) =>
      [...fs.readFileSync(file, "utf8").matchAll(GRID)]
        .filter((match) => topLevelTracks(match[1]).some((track) => BARE_FR.test(track)))
        .map((match) => `${path.relative(ROOT, file)}: ${match[0]}`),
    );
    expect(offenders).toEqual([]);
  });
});
