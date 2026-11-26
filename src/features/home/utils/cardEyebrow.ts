export function cardEyebrow(subtitle?: string | null): string {
  if (!subtitle) return "Extrait de Parfum";
  const trimmed = subtitle.replace(/\s+/g, " ").trim();
  return trimmed.length > 42 ? `${trimmed.slice(0, 41).trimEnd()}…` : trimmed;
}
