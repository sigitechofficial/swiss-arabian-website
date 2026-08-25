export type GuestContact = {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
};

export type DeliveryMethodOption = {
  id: string;
  name: string;
  description?: string | null;
  price?: string | number | null;
  currency?: string | null;
};

export type PaymentMethodOption = {
  id: string;
  name: string;
  type?: string;
};

export type CheckoutValidation = {
  isValid: boolean;
  errors?: Array<{ message?: string }>;
};

export type CheckoutSessionResponse = {
  checkoutSessionId: string;
  status?: string;
  validation?: CheckoutValidation;
};
