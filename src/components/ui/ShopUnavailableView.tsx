import { AppButton } from "./AppButton";

export function ShopUnavailableView() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center gap-4 px-4 py-20 text-center">
      <h1 className="font-display text-3xl text-sa-primary">
        This shop is temporarily unavailable
      </h1>
      <p className="text-sa-muted">
        We cannot load this storefront right now. Please try again later.
      </p>
      <AppButton
        type="button"
        onClick={() => {
          window.location.assign("/");
        }}
      >
        Try again
      </AppButton>
    </div>
  );
}
