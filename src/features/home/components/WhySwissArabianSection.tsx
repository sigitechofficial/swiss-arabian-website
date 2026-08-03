import Image from "next/image";
import { whyItems } from "@/features/home/data/homeContent";

export function WhySwissArabianSection() {
  return (
    <section
      className="mx-auto max-w-[1280px] px-4 pt-8 sm:px-6 lg:px-10"
      aria-label="Why Swiss Arabian"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {whyItems.map((item) => (
          <div
            key={item.subtitle}
            className="relative overflow-hidden bg-cream p-6 pr-24 dark:bg-section-soft"
          >
            <Image
              src={item.image}
              alt=""
              aria-hidden
              width={152}
              height={152}
              className="sa-art-fade absolute -right-4 -top-2 size-[152px] object-cover opacity-90"
            />
            <p
              className={`relative font-sans leading-[1.12] tracking-tight text-sa-primary ${
                "boldAll" in item && item.boldAll
                  ? "text-[21px] font-bold leading-[1.22]"
                  : "text-[23px]"
              }`}
            >
              {item.lines[0]}
              <br />
              {"boldAll" in item && item.boldAll ? (
                <span className="text-2xl">{item.lines[1]}</span>
              ) : item.emphasizeLast ? (
                <b className="font-bold">{item.lines[1]}</b>
              ) : (
                item.lines[1]
              )}
            </p>
            <p className="relative mt-2.5 text-[13.5px] font-medium text-sa-muted">
              {item.subtitle}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
