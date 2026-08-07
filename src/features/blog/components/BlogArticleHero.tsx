import Image from "next/image";

type BlogArticleHeroProps = {
  image: string;
  eyebrow: string;
  title: string;
  subtitle: string;
};

/** Figma Page Hero — overlay + live text (915:7181) */
export function BlogArticleHero({
  image,
  eyebrow,
  title,
  subtitle,
}: BlogArticleHeroProps) {
  return (
    <section
      className="relative flex h-[300px] w-full flex-col items-center justify-center gap-3 overflow-hidden px-4 sm:h-[360px] sm:gap-4 lg:h-[420px]"
      aria-label={title}
    >
      <Image
        src={image}
        alt=""
        fill
        priority
        quality={90}
        className="object-cover object-center"
        sizes="100vw"
      />
      <div
        className="absolute inset-0 bg-[rgba(44,36,29,0.62)]"
        aria-hidden
      />
      <p className="relative z-[1] text-center text-[11px] font-semibold uppercase tracking-[0.36em] text-gold-light sm:text-[12px] sm:tracking-[0.42em]">
        {eyebrow}
      </p>
      <h1 className="relative z-[1] max-w-[90vw] text-center font-sans text-[clamp(1.35rem,4.2vw,3.5rem)] font-normal uppercase leading-tight tracking-[0.12em] text-white sm:tracking-[0.18em] lg:tracking-[0.24em]">
        {title}
      </h1>
      <p className="relative z-[1] text-center text-[12px] font-semibold uppercase tracking-[0.22em] text-white/75 sm:text-[13px] sm:tracking-[0.28em]">
        {subtitle}
      </p>
    </section>
  );
}
