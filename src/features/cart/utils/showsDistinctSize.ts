/** Hide placeholder sizes such as "Default Title" and sizes that repeat the product name. */
export function showsDistinctSize(title: string, sizeLabel?: string) {
  const size = sizeLabel?.replace(/\s+/g, " ").trim();
  if (!size || /^default(\s+title)?$/i.test(size)) return false;
  return size.toLowerCase() !== title.replace(/\s+/g, " ").trim().toLowerCase();
}
