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

/** Return or exchange items of a guest order (the access token stays in this browser). */
export default async function GuestOrderReturnPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderNumber: string }>;
  searchParams: Promise<{ type?: string }>;
}) {
  const [{ orderNumber }, { type }] = await Promise.all([params, searchParams]);
  return <AfterSalesFlowPageView orderNumber={decodeURIComponent(orderNumber)} initialKind={flowKindParam(type)} />;
}
