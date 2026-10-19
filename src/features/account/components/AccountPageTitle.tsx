import { accountLede } from "@/styles/accountChrome";
import { pageTitle } from "@/styles/shopChrome";

import { accountContainer } from "../constants/accountLayout";

type AccountPageTitleProps = {
  title: string;
  subtitle?: string;
};

export function AccountPageTitle({ title, subtitle }: AccountPageTitleProps) {
  return (
    <header className={`${accountContainer} pb-5 pt-7 sm:pt-8`}>
      <h1 className={pageTitle}>{title}</h1>
      {subtitle ? <p className={`${accountLede} max-w-[720px]!`}>{subtitle}</p> : null}
    </header>
  );
}
