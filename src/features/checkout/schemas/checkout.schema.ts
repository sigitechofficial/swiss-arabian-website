import { z } from "zod";

export const checkoutSchema = z.object({
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
  paymentMethod: z.enum(["card", "wallet", "tabby", "tamara", "cod"]),
  cardNumber: z.string().optional(),
  cardExpiry: z.string().optional(),
  cardCvc: z.string().optional(),
  cardName: z.string().optional(),
  useShippingAsBilling: z.boolean(),
  discountCode: z.string().optional(),
});

export type CheckoutFormValues = z.infer<typeof checkoutSchema>;
