import { z } from "zod";

function requireWhenDistinctBilling(
  value: string | undefined,
  min: number,
  message: string,
): string | undefined {
  if (!value || value.trim().length < min) return message;
  return undefined;
}

export const checkoutSchema = z
  .object({
    email: z.string().email("Enter a valid email"),
    emailOffers: z.boolean(),
    country: z.string().min(1),
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    address: z.string().min(3, "Address is required"),
    apartment: z.string().optional(),
    city: z.string().min(1, "City is required"),
    emirate: z.string().min(1, "Emirate is required"),
    phone: z.string().min(7, "Phone is required"),
    saveInfo: z.boolean(),
    smsOffers: z.boolean(),
    discountCode: z.string().optional(),
    billingSameAsShipping: z.boolean(),
    billingCountry: z.string().optional(),
    billingFirstName: z.string().optional(),
    billingLastName: z.string().optional(),
    billingAddress: z.string().optional(),
    billingApartment: z.string().optional(),
    billingCity: z.string().optional(),
    billingEmirate: z.string().optional(),
    billingPhone: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.billingSameAsShipping) return;

    const checks: Array<[string, string | undefined]> = [
      [
        "billingFirstName",
        requireWhenDistinctBilling(data.billingFirstName, 1, "First name is required"),
      ],
      [
        "billingLastName",
        requireWhenDistinctBilling(data.billingLastName, 1, "Last name is required"),
      ],
      [
        "billingAddress",
        requireWhenDistinctBilling(data.billingAddress, 3, "Address is required"),
      ],
      ["billingCity", requireWhenDistinctBilling(data.billingCity, 1, "City is required")],
      [
        "billingEmirate",
        requireWhenDistinctBilling(data.billingEmirate, 1, "Emirate is required"),
      ],
      [
        "billingPhone",
        requireWhenDistinctBilling(data.billingPhone, 7, "Phone is required"),
      ],
      [
        "billingCountry",
        requireWhenDistinctBilling(data.billingCountry, 1, "Country is required"),
      ],
    ];

    for (const [path, message] of checks) {
      if (!message) continue;
      ctx.addIssue({ code: z.ZodIssueCode.custom, message, path: [path] });
    }
  });

export type CheckoutFormValues = z.infer<typeof checkoutSchema>;
