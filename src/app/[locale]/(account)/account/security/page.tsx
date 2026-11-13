import type { Metadata } from "next";
import { AccountSecurityPageView } from "@brand-ui";

export const metadata: Metadata = {
  title: "Security",
};

export default function SecurityPage() {
  return <AccountSecurityPageView />;
}
