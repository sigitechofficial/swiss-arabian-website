import type { Metadata } from "next";
import { routeTranslator } from "@/lib/i18n/routeLocale";
import { AccountRewardsPageView } from "@brand-ui";
import { requireBrandFeature } from "@/lib/brand/featureGate";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await routeTranslator();
  return {
    title: t("pages.title.rewards"),
  };
}

export default function AccountRewardsPage() {
  requireBrandFeature("loyalty");
  return <AccountRewardsPageView />;
}
