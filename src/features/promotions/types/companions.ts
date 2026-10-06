export type CompanionProduct = {
  productId: string;
  sku: string;
  slug: string | null;
  title: string;
  image: string | null;
  price: string | null;
  amount: string | null;
  inStock: boolean;
};

export type CompanionGroup = {
  id: string;
  heading: string;
  seeAllPath: string | null;
  products: CompanionProduct[];
};

export type CompanionCopy = {
  addSelected: string;
  before: string;
  saving: string;
  total: string;
  thisProduct: string;
  seeAll: string;
};

export type ProductCompanions = {
  current: CompanionProduct | null;
  groups: CompanionGroup[];
  copy: CompanionCopy;
};

export type CompanionPreview = {
  beforeSavings: string | null;
  promotionSaving: string | null;
  yourTotal: string | null;
  message: string | null;
  readyToAdd: boolean;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function readProduct(value: unknown): CompanionProduct | null {
  const row = asRecord(value);
  const productId = asString(row?.productId);
  const sku = asString(row?.sku);
  const title = asString(row?.title);
  if (!row || !productId || !sku || !title) return null;
  return {
    productId,
    sku,
    slug: asString(row.slug),
    title,
    image: asString(row.image),
    price: asString(row.price),
    amount: asString(row.amount),
    inStock: row.inStock === true,
  };
}

export function readProductCompanions(value: unknown): ProductCompanions {
  const row = asRecord(value);
  const copy = asRecord(row?.copy);
  const groups = Array.isArray(row?.groups)
    ? row.groups.flatMap((item) => {
        const group = asRecord(item);
        const heading = asString(group?.heading);
        const products = Array.isArray(group?.products)
          ? group.products.flatMap((product) => {
              const parsed = readProduct(product);
              return parsed ? [parsed] : [];
            })
          : [];
        if (!group || !heading || products.length === 0) return [];
        return [{
          id: asString(group.id) ?? heading,
          heading,
          seeAllPath: asString(group.seeAllPath),
          products,
        }];
      })
    : [];
  return {
    current: readProduct(row?.current),
    groups,
    copy: {
      addSelected: asString(copy?.addSelected) ?? "Add selected",
      before: asString(copy?.before) ?? "Before savings",
      saving: asString(copy?.saving) ?? "Promotion saving",
      total: asString(copy?.total) ?? "Your total",
      thisProduct: asString(copy?.thisProduct) ?? "This product",
      seeAll: asString(copy?.seeAll) ?? "See all",
    },
  };
}

export function readCompanionPreview(value: unknown): CompanionPreview {
  const row = asRecord(value);
  return {
    beforeSavings: asString(row?.beforeSavings),
    promotionSaving: asString(row?.promotionSaving),
    yourTotal: asString(row?.yourTotal),
    message: asString(row?.message),
    readyToAdd: row?.readyToAdd === true,
  };
}
