import Link from "next/link";

import { accountContainer } from "../constants/accountLayout";

type AccountBreadcrumbProps = {
  label: string;
};

/** Home / <page> */
export function AccountBreadcrumb({ label }: AccountBreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className={`${accountContainer} py-[14px]`}>
      <p className="text-[12px] text-sa-secondary">
        <Link href="/" className="hover:text-sa-primary">
          Home
        </Link>
        <span className="px-1.5" aria-hidden>
          /
        </span>
        <span className="text-sa-primary">{label}</span>
      </p>
    </nav>
  );
}
