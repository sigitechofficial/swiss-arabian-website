import { AuthGuard } from "@/components/guards/AuthGuard";
import { PageLoading, StorefrontShell } from "@brand-ui";

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <StorefrontShell>
      <AuthGuard
        requireAuth
        // The brand's loading state (Sapil: v9 pastel tiles, not Swiss Arabian's bottle mark).
        checking={<PageLoading label="Checking session…" labelKey="session" fill />}
        redirecting={<PageLoading label="Redirecting…" labelKey="redirecting" fill />}
      >
        {children}
      </AuthGuard>
    </StorefrontShell>
  );
}
