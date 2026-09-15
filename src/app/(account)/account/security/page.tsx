import type { Metadata } from "next";
import { AccountSecurityPageView } from "@/features/account/components/AccountSecurityPageView";

export const metadata: Metadata = {
  title: "Security",
};

export default function SecurityPage() {
  return <AccountSecurityPageView />;
}
