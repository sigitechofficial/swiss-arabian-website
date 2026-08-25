import { StorefrontShell } from "@/components/layout/StorefrontShell";
import { AuthGuard } from "@/components/guards/AuthGuard";

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <StorefrontShell>
      <AuthGuard requireAuth>{children}</AuthGuard>
    </StorefrontShell>
  );
}
