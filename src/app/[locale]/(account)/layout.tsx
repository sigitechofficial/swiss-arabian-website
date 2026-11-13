import { AuthGuard } from "@/components/guards/AuthGuard";
import { StorefrontShell } from "@brand-ui";

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
