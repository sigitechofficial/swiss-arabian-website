import { StorefrontShell } from "@brand-ui";

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <StorefrontShell>{children}</StorefrontShell>;
}
