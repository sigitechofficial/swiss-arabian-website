/**
 * Store hours as written on the store list ("Mon–Sat 10:00 AM–10:00 PM · Sun
 * 10:00 AM–12:00 AM") → schema.org OpeningHoursSpecification. Strict: when any
 * part cannot be read, nothing is returned, so structured data never states
 * hours the page does not show.
 */
export type OpeningHoursSpecification = {
  "@type": "OpeningHoursSpecification";
  dayOfWeek: string[];
  opens: string;
  closes: string;
};

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

function dayIndex(token: string): number {
  const key = token.trim().toLowerCase().replace(/\.$/, "");
  if (key.length < 3) return -1;
  return DAYS.findIndex((day) => day.toLowerCase().startsWith(key));
}

const DASH = /\s*(?:[-–—]|\bto\b)\s*/i;

function readDays(text: string): string[] | null {
  const value = text.trim().toLowerCase();
  if (value === "daily" || value === "every day" || value === "everyday") {
    return [...DAYS];
  }
  const parts = value.split(DASH);
  if (parts.length === 1) {
    const day = dayIndex(parts[0]!);
    return day < 0 ? null : [DAYS[day]!];
  }
  if (parts.length !== 2) return null;
  const from = dayIndex(parts[0]!);
  const to = dayIndex(parts[1]!);
  if (from < 0 || to < 0) return null;
  const days: string[] = [];
  for (let i = from; ; i = (i + 1) % 7) {
    days.push(DAYS[i]!);
    if (i === to) break;
  }
  return days;
}

/** "10:00 AM", "10 pm", "22:00" → "22:00"; null when unreadable. */
function readTime(text: string): string | null {
  const match = text
    .trim()
    .match(/^(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?)?$/i);
  if (!match) return null;
  let hours = Number(match[1]);
  const minutes = Number(match[2] ?? "0");
  const meridiem = match[3]?.toLowerCase().replace(/\./g, "");
  if (minutes > 59) return null;
  if (meridiem) {
    if (hours < 1 || hours > 12) return null;
    hours = (hours % 12) + (meridiem === "pm" ? 12 : 0);
  } else if (hours > 23 || match[2] === undefined) {
    return null;
  }
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function readSegment(segment: string): OpeningHoursSpecification | null {
  const match = segment
    .trim()
    .match(/^([A-Za-z.\s–—-]+?)\s+(\d[\s\S]*)$/);
  if (!match) return null;
  const days = readDays(match[1]!);
  const times = match[2]!.split(DASH);
  if (!days || times.length !== 2) return null;
  const opens = readTime(times[0]!);
  const closes = readTime(times[1]!);
  if (!opens || !closes) return null;
  return { "@type": "OpeningHoursSpecification", dayOfWeek: days, opens, closes };
}

export function openingHoursSpecification(
  text: string | null | undefined,
): OpeningHoursSpecification[] | null {
  if (!text?.trim()) return null;
  const segments = text.split(/\s*[·;|,]\s*/).filter(Boolean);
  const specs: OpeningHoursSpecification[] = [];
  for (const segment of segments) {
    const spec = readSegment(segment);
    if (!spec) return null;
    specs.push(spec);
  }
  return specs.length ? specs : null;
}
