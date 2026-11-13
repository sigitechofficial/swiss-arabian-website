import type { Metadata } from "next";
import { routeTranslator } from "@/lib/i18n/routeLocale";
import { AccountPlaceholderPageView } from "@brand-ui";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await routeTranslator();
  return {
    title: t("pages.title.membership"),
  };
}

export default function AccountMembershipPage() {
  return (
    <AccountPlaceholderPageView
      title="Membership Benefits"
      description="Your tier, points and member perks will appear here. Your active plan is already visible under My Subscription."
    />
  );
}
