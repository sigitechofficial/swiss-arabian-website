import { LocaleLink } from "@/lib/i18n/LocaleLink";
import { isExternalHref } from "../utils/resolveCmsLink";

type CmsCtaLinkProps = {
  href: string | null;
  className?: string;
  children: React.ReactNode;
};

export function CmsCtaLink({ href, className, children }: CmsCtaLinkProps) {
  if (!href) return null;
  if (isExternalHref(href)) {
    return (
      <a
        className={className}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
      </a>
    );
  }
  return (
    <LocaleLink className={className} href={href}>
      {children}
    </LocaleLink>
  );
}
