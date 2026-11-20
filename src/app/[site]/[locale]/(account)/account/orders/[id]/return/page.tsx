import { routeTranslator } from "@/lib/i18n/routeLocale";
import type { Metadata } from "next";
import { AfterSalesFlowPageView } from "@brand-ui";
import { flowKindParam } from "@/features/afterSales/utils/afterSalesFlow";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await routeTranslator();
  return {
    title: t("afterSales.flow.title"),
    robots: { index: false, follow: false },
  };
}

/** Return or exchange items of a signed-in customer's order (guided steps). */
export default async function AccountOrderReturnPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ type?: string }>;
}) {
  const [{ id }, { type }] = await Promise.all([params, searchParams]);
  return <AfterSalesFlowPageView orderId={id} initialKind={flowKindParam(type)} />;
}
