import { AccountSubscriptionDetailPageView } from "@brand-ui";

type Props = { params: Promise<{ id: string }> };

export default async function AccountSubscriptionDetailPage({ params }: Props) {
  const { id } = await params;
  return <AccountSubscriptionDetailPageView id={id} />;
}
