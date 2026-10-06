export type PdpPrVideo = {
  url: string;
  name: string | null;
};

function asHttpsUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const url = value.trim();
  return /^https:\/\//i.test(url) ? url : null;
}

function fromRecord(raw: unknown): PdpPrVideo | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const row = raw as Record<string, unknown>;
  const url = asHttpsUrl(row.url);
  if (!url) return undefined;
  const name = typeof row.name === "string" && row.name.trim() ? row.name.trim() : null;
  return { url, name };
}

/** Zone `pr_video` on the PDP payload — root or `product`. */
export function pickPrVideo(raw: unknown): PdpPrVideo | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const row = raw as Record<string, unknown>;
  return (
    fromRecord(row.prVideo) ??
    fromRecord(row.pr_video) ??
    fromRecord(
      row.product && typeof row.product === "object"
        ? (row.product as Record<string, unknown>).prVideo ??
            (row.product as Record<string, unknown>).pr_video
        : undefined,
    )
  );
}
