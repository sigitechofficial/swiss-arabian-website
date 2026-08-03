import { StorefrontShell } from "@/components/layout/StorefrontShell";

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <StorefrontShell>{children}</StorefrontShell>;
}
