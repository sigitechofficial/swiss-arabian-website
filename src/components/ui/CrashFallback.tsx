"use client";

type CrashFallbackProps = {
  onRetry: () => void;
};

const retryClass =
  "inline-flex h-11 items-center justify-center rounded-md bg-terra px-5 text-sm font-semibold text-white hover:bg-[var(--sa-action-primary-hover)]";

export function CrashFallback({ onRetry }: CrashFallbackProps) {
  return (
    <section className="mx-auto flex max-w-lg flex-col items-center gap-4 px-4 py-24 text-center">
      <h1 className="text-balance font-display text-4xl text-sa-primary">
        Something went wrong
      </h1>
      <p className="text-sa-muted">
        This page ran into a problem. You can try again, or go back home.
      </p>
      <button type="button" className={retryClass} onClick={onRetry}>
        Try again
      </button>
      <a className="text-sm text-sa-muted underline underline-offset-4" href="/">
        Back home
      </a>
    </section>
  );
}
