import { apiPost } from "@/lib/api/apiClient";
import { storefrontContextQuery } from "@/lib/storefront/context";

export type CreateCustomerReviewInput = {
  productId: string;
  rating: number;
  title?: string;
  body?: string;
  displayName?: string;
  variantId?: string;
};

export async function createCustomerReview(
  input: CreateCustomerReviewInput,
  zoneCode?: string | null,
): Promise<void> {
  const qs = storefrontContextQuery({ zoneCode });
  await apiPost(`/storefront/customer/reviews?${qs}`, {
    productId: input.productId,
    rating: input.rating,
    ...(input.title ? { title: input.title } : {}),
    ...(input.body ? { body: input.body } : {}),
    ...(input.displayName ? { displayName: input.displayName } : {}),
    ...(input.variantId ? { variantId: input.variantId } : {}),
  });
}
