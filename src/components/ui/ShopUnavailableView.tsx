import { LocaleLink } from "@/lib/i18n/LocaleLink";

const action =
  "inline-flex h-11 items-center justify-center rounded-md bg-terra px-5 text-sm font-semibold text-white hover:bg-[var(--sa-action-primary-hover)]";

export function ShopUnavailableView() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center gap-4 px-4 py-20 text-center">
      <h1 className="font-display text-3xl text-sa-primary">
        This shop is temporarily unavailable
      </h1>
      <p className="text-sa-muted">
        We cannot load this storefront right now. Please try again later.
      </p>
      <LocaleLink className={action} href="/">
        Try again
      </LocaleLink>
    </div>
  );
}
