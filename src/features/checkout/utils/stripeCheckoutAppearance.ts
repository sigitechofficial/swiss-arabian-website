import type { StripeCheckoutElementsSdkOptions } from "@stripe/stripe-js";

/** Brand tokens — Stripe's iframe can't read our CSS variables. */
export const STRIPE_BRAND = {
  copper: "#8c4435",
  ink: "#241f1b",
  ink2: "#5b5148",
  danger: "#b4483f",
};

export const STRIPE_FONT_FAMILY = '"Benton Sans Wide", system-ui, sans-serif';

export function stripeCheckoutElementsOptions(
  clientSecret: string,
  extras: {
    billingCountry?: string | null;
    customerName?: string | null;
    email?: string | null;
    phoneNumber?: string | null;
  } = {},
): StripeCheckoutElementsSdkOptions {
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const billingCountry = extras.billingCountry?.trim();
  const customerName = extras.customerName?.trim();
  return {
    clientSecret,
    elementsOptions: {
      fonts: [400, 500].map((weight) => ({
        family: "Benton Sans Wide",
        src: `url(${origin}/fonts/benton-sans-wide-${weight}.ttf)`,
        weight: String(weight),
      })),
      appearance: {
        theme: "stripe",
        variables: {
          fontFamily: STRIPE_FONT_FAMILY,
          fontSizeBase: "14px",
          colorPrimary: STRIPE_BRAND.copper,
          colorBackground: "#ffffff",
          colorText: STRIPE_BRAND.ink,
          colorTextSecondary: STRIPE_BRAND.ink2,
          colorTextPlaceholder: "#a3978a",
          colorDanger: STRIPE_BRAND.danger,
          borderRadius: "4px",
        },
      },
    },
    defaultValues: {
      ...(billingCountry
        ? {
            billingAddress: {
              ...(customerName ? { name: customerName } : {}),
              address: { country: billingCountry },
            },
          }
        : {}),
    },
  };
}
