import Link from "next/link";

/** Figma · Section · The House Band — node 254:1999 */
export function HouseBandSection() {
  return (
    <section
      className="sa-grad-house-band relative overflow-hidden px-6 py-9 text-center sm:px-10"
      aria-label="The Swiss Arabian house"
    >
      <div
        className="pointer-events-none absolute inset-[14px] border border-[rgba(231,208,156,0.24)] sm:inset-[22px]"
        aria-hidden
      />
      <div className="relative mx-auto flex min-h-[480px] max-w-[1200px] flex-col items-center justify-center px-4 py-16 sm:min-h-[566px] sm:px-[60px]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gold">
          The Swiss Arabian House
        </p>
        <h2 className="mt-5 max-w-[780px] font-sans text-[clamp(2.5rem,5.5vw,4.02rem)] font-bold leading-[1.08] tracking-[-0.02em]">
          <span className="block text-[#f6f0e6]">Where two worlds</span>
          <em className="block font-bold italic text-[#e7d09c]">
            become one scent
          </em>
        </h2>
        <p className="mx-auto mt-6 max-w-[640px] text-[17px] leading-[1.6] text-[rgba(246,240,230,0.82)]">
          Fifty years of blending Western craft with Oriental soul — each
          fragrance composed to be worn, remembered, and made entirely your own.
        </p>
        <Link
          href="/collections"
          className="mt-8 inline-flex items-center justify-center bg-gold px-10 py-[18px] text-[14px] font-semibold text-[#2c2018] transition-[filter] hover:brightness-110"
        >
          Explore the collection
        </Link>
      </div>
    </section>
  );
}
