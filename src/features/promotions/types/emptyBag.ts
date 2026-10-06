export type EmptyBagProduct = {
  productId: string | null;
  sku: string;
  title: string;
  price: string | null;
  amount: string | null;
  image: string | null;
  slug: string | null;
};

export type EmptyBagGroup = {
  id: string;
  heading: string;
  campaignCode: string | null;
  products: EmptyBagProduct[];
};

export type EmptyBag = {
  addLabel: string;
  groups: EmptyBagGroup[];
};

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function product(value: unknown): EmptyBagProduct | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const row = value as Record<string, unknown>;
  const sku = text(row.sku);
  const title = text(row.title);
  if (!sku || !title) return null;
  return {
    productId: text(row.productId) || null,
    sku,
    title,
    price: text(row.price) || null,
    amount: text(row.amount) || null,
    image: text(row.image) || null,
    slug: text(row.slug) || null,
  };
}

export function readEmptyBag(raw: unknown): EmptyBag {
  const data = raw && typeof raw === "object" && !Array.isArray(raw)
    ? (raw as Record<string, unknown>)
    : {};
  const groups = Array.isArray(data.groups)
    ? data.groups.flatMap((item) => {
        if (!item || typeof item !== "object" || Array.isArray(item)) return [];
        const row = item as Record<string, unknown>;
        const heading = text(row.heading);
        const products = Array.isArray(row.products)
          ? row.products.flatMap((entry) => {
              const parsed = product(entry);
              return parsed ? [parsed] : [];
            })
          : [];
        if (!heading || products.length === 0) return [];
        return [{
          id: text(row.id),
          heading,
          campaignCode: text(row.campaignCode) || null,
          products,
        }];
      })
    : [];
  return {
    addLabel: text(data.addLabel) || "Add",
    groups,
  };
}
