import { FeaturePlaceholder } from "@/components/shared/FeaturePlaceholder";

export function OrdersPageView() {
  return (
    <FeaturePlaceholder
      title="Orders"
      description="UI is ready for GET /storefront/orders once the backend list endpoint is live."
    />
  );
}

export function OrderDetailPageView({ id }: { id: string }) {
  return (
    <FeaturePlaceholder
      title={`Order ${id}`}
      description="Detail view is waiting on GET /storefront/orders/:id."
    />
  );
}
