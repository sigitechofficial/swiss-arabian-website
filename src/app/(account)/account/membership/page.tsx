import { AccountPlaceholderPageView } from "@/features/account";

export const metadata = {
  title: "Membership Benefits",
};

export default function AccountMembershipPage() {
  return (
    <AccountPlaceholderPageView
      title="Membership Benefits"
      description="Your tier, points and member perks will appear here. Your active plan is already visible under My Subscription."
    />
  );
}
