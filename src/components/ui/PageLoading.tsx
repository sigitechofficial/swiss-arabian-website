import Image from "next/image";

const LOADER_GIF = "/assets/catalog/loading-perfume.gif";

type LoaderMarkProps = {
  /** Outer diameter in px (ring included). */
  size?: number;
  className?: string;
};

/**
 * Brand loading mark — the animated perfume bottle in a dark medallion,
 * circled by a slow copper ring. Decorative; pair it with visible text.
 */
export function LoaderMark({ size = 112, className = "" }: LoaderMarkProps) {
  return (
    <span
      aria-hidden="true"
      className={`relative inline-flex shrink-0 items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <span className="absolute -inset-3 rounded-full bg-terra/15 blur-xl motion-safe:animate-pulse" />
      <span className="absolute inset-0 rounded-full border-2 border-terra/15 border-t-terra [animation-duration:1.6s] motion-safe:animate-spin" />
      <span className="absolute inset-[7px] overflow-hidden rounded-full bg-black shadow-[0_14px_32px_-14px_rgba(60,28,18,0.7)]">
        <Image
          src={LOADER_GIF}
          alt=""
          fill
          unoptimized
          priority
          sizes={`${size}px`}
          className="scale-110 object-cover"
        />
      </span>
    </span>
  );
}

type PageLoadingProps = {
  label?: string;
  /** Full content area (route/guard loading) — taller than an in-page section. */
  fill?: boolean;
};

export function PageLoading({ label = "Loading…", fill = false }: PageLoadingProps) {
  return (
    <div
      className={`flex w-full flex-col items-center justify-center gap-6 px-4 py-16 ${
        fill ? "min-h-[70vh] flex-1" : "min-h-[50vh]"
      }`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <LoaderMark />
      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-sa-muted">
        {label}
      </p>
    </div>
  );
}
