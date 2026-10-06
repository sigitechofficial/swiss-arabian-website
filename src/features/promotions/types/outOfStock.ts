export type OutOfStockProduct = {
  sku: string;
  title: string;
  price: string | null;
  image: string | null;
  slug: string | null;
};

export type OutOfStockState = {
  outOfStock: boolean;
  message: string | null;
  notifyAvailable: boolean;
  heading: string | null;
  addLabel: string;
  campaignCode: string | null;
  products: OutOfStockProduct[];
};

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function product(value: unknown): OutOfStockProduct | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const row = value as Record<string, unknown>;
  const sku = text(row.sku);
  const title = text(row.title);
  if (!sku || !title) return null;
  return {
    sku,
    title,
    price: text(row.price) || null,
    image: text(row.image) || null,
    slug: text(row.slug) || null,
  };
}

export function readOutOfStock(raw: unknown): OutOfStockState {
  const data = raw && typeof raw === "object" && !Array.isArray(raw)
    ? (raw as Record<string, unknown>)
    : {};
  const notify = data.notify && typeof data.notify === "object" && !Array.isArray(data.notify)
    ? (data.notify as { available?: unknown })
    : null;
  const products = Array.isArray(data.products)
    ? data.products.flatMap((item) => {
        const parsed = product(item);
        return parsed ? [parsed] : [];
      })
    : [];
  const heading = text(data.heading);
  return {
    outOfStock: data.outOfStock === true,
    message: text(data.message) || null,
    notifyAvailable: notify?.available === true,
    heading: heading && products.length > 0 ? heading : null,
    addLabel: text(data.addLabel) || "Add",
    campaignCode: text(data.campaignCode) || null,
    products: heading ? products : [],
  };
}
