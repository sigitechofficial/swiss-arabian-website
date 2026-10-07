export type OfferIcon = "bundle" | "delivery" | "card" | "star" | "tag" | "gift" | "bank" | "clock";

export type OfferContext = {
  qty: number;
  subtotal: number;
  price: number;
  fmt: (amount: number) => string;
};

export type OfferValue = string | ((ctx: OfferContext) => string);

export type OfferAction = { label: string; href: string } | { label: string; copy: string };

export type OfferProgress = {
  value: number;
  max: number;
  label: string;
};

/** One row in the offers modal. `title`, `text`, and `progress` may depend on quantity. */
export type PdpOffer = {
  id: string;
  tag: string;
  icon: OfferIcon;
  featured?: boolean;
  short?: string;
  headline?: string;
  title: OfferValue;
  text?: OfferValue;
  progress?: (ctx: OfferContext) => OfferProgress;
  action?: OfferAction;
};
