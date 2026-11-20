import type { Metadata } from "next";
import { routeTranslator } from "@/lib/i18n/routeLocale";
import { AccountSubscriptionDetailPageView } from "@brand-ui";
import { requireBrandFeature } from "@/lib/brand/featureGate";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await routeTranslator();
  return { title: t("pages.title.subscription") };
}

export default async function AccountSubscriptionDetailPage({ params }: Props) {
  requireBrandFeature("subscriptions");
  const { id } = await params;
  return <AccountSubscriptionDetailPageView id={id} />;
}
