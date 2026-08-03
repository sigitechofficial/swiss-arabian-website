import Image from "next/image";
import Link from "next/link";
import { genderTiles } from "@/features/home/data/homeContent";

export function ShopByGenderSection() {
  return (
    <section
      className="mx-auto max-w-[1280px] px-4 pt-14 sm:px-6 lg:px-10"
      aria-label="Shop by gender"
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {genderTiles.map((tile) => (
          <Link
            key={tile.label}
            href={tile.href}
            className="group relative block aspect-[388/369] overflow-hidden"
          >
            <Image
              src={tile.image}
              alt={tile.alt}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
            <span className="sa-grad-tile absolute inset-0" />
            <span className="absolute left-7 top-6 font-sans text-[44px] font-bold tracking-tight text-white drop-shadow-lg lg:text-[52px]">
              {tile.label}
            </span>
            <span className="absolute bottom-5 right-5 flex size-14 items-center justify-center rounded-full bg-white shadow-lg transition-transform group-hover:translate-x-1">
              <svg
                className="size-[22px] text-ink"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.9"
                aria-hidden
              >
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
