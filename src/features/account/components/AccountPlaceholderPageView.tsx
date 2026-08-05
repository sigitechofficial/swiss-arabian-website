import { accountContainer } from "../constants/accountLayout";
import { AccountPageShell } from "./AccountPageShell";
import { AccountPageTitle } from "./AccountPageTitle";

type AccountPlaceholderPageViewProps = {
  title: string;
  description: string;
};

/**
 * Sections whose storefront API is not available yet still need the real
 * account chrome, so they share this shell instead of a bare stub page.
 */
export function AccountPlaceholderPageView({
  title,
  description,
}: AccountPlaceholderPageViewProps) {
  return (
    <AccountPageShell>
      <AccountPageTitle title={title} />
      <div className={`${accountContainer} pb-20`}>
        <div className="border border-sa-border bg-section-soft px-6 py-10">
          <p className="max-w-[520px] text-[14px] leading-relaxed text-sa-secondary">
            {description}
          </p>
        </div>
      </div>
    </AccountPageShell>
  );
}
