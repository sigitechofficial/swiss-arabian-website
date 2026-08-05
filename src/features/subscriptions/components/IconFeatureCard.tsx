import Image from "next/image";

import type { FeatureItem } from "@/features/subscriptions/data/subscriptionContent";

type IconFeatureCardProps = {
  item: FeatureItem;
  /** Bordered surface card vs plain how-step column */
  variant?: "card" | "column";
};

/** Figma · Icon Feature Card 330:170 */
export function IconFeatureCard({
  item,
  variant = "card",
}: IconFeatureCardProps) {
  return (
    <article
      className={
        variant === "card"
          ? "flex flex-1 flex-col items-start gap-3 border border-sa-border bg-surface p-7"
          : "flex flex-1 flex-col items-start gap-3 px-4 py-2"
      }
    >
      <div className="flex size-12 shrink-0 items-center justify-center bg-section-soft">
        <span className="relative block size-6">
          <Image
            src={item.icon}
            alt=""
            width={24}
            height={24}
            className="size-6"
            unoptimized
          />
        </span>
      </div>
      <h3 className="text-[17px] font-bold text-sa-primary">{item.title}</h3>
      <p className="text-[13.5px] leading-[1.6] text-sa-secondary">{item.body}</p>
    </article>
  );
}
