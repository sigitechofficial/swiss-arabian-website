import { routeTranslator } from "@/lib/i18n/routeLocale";
import type { Metadata } from "next";
import { AccountOrderDetailPageView } from "@brand-ui";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await routeTranslator();
  return {
    title: t("pages.title.orderDetails"),
    robots: { index: false, follow: false },
  };
}

export default async function AccountOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AccountOrderDetailPageView orderId={id} />;
}
