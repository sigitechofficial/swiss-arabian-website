import { StorefrontShell } from "@/components/layout/StorefrontShell";

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <StorefrontShell>{children}</StorefrontShell>;
}
