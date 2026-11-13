import type { ElementType, ReactNode } from "react";
import {
  cx,
  DefaultLink,
  PlusIcon,
  tintStyle,
  type SapilLinkComponent,
  type SapilTint,
} from "./shared";
import { Price } from "./Typography";

export type ProductCardProps = {
  name: string;
  href: string;
  /** image URL (rendered as <img>), or an element such as next/image filling its box */
  image: string | ReactNode;
  /** defaults to "{name} bottle" */
  imageAlt?: string;
  /** media tile colour (v9 tint() → one of the pastels) */
  tile?: SapilTint;
  /** formatted price, e.g. "AED 63" */
  price: ReactNode;
  /** struck-out full price, e.g. "AED 90" */
  was?: ReactNode;
  /** screen-reader word before the was-price (default "was") */
  wasLabel?: string;
  /** whole-number discount for the "−30%" badge (`.card-off`) */
  discountPercent?: number;
  /** two pill tags, e.g. ["EDP", "Unisex"] */
  tags?: ReactNode[];
  /** navy tags (note-search hits, `.card-tags.hit`) */
  tagsHighlighted?: boolean;
  /** scent family line, e.g. "Fruity · Strawberry · Pineapple" (`.card-fam`) */
  family?: ReactNode;
  /** v9 hides the family line; set true to show it (see README: needs a decision) */
  showFamily?: boolean;
  /** image zoom: bottles 1.62, gift boxes 1 (`.card.gift`), body sprays 1.15 (`.card.deo`) */
  shape?: "bottle" | "gift" | "deo";
  /** adds the round + button (shown at ≤749px, as v9) */
  onAdd?: () => void;
  /** green "added" state of the + button */
  added?: boolean;
  /** "Shop Now" pill that rises on hover */
  quickLabel?: string;
  /** accessible name of the image link; defaults to "View {name}" */
  viewLabel?: string;
  /** accessible name of the + button; defaults to "Add {name} to bag" */
  addLabel?: string;
  /** a status pill in the badge spot (e.g. "Out of stock"); wins over the −% badge */
  badge?: ReactNode;
  /** small round controls at the tile's top end corner (wishlist, quick view) */
  actions?: ReactNode;
  headingLevel?: ElementType;
  LinkComponent?: SapilLinkComponent;
  className?: string;
};

/** Image zoom per shape; pages that pass their own image element apply it themselves. */
export const PRODUCT_CARD_ZOOM = {
  bottle: "[transform:scale(1.62)] group-hover:[transform:scale(1.72)]",
  gift: "[transform:scale(1)] group-hover:[transform:scale(1.06)]",
  deo: "[transform:scale(1.15)] group-hover:[transform:scale(1.22)]",
} as const;

/** v9 `.card`: tinted 1:1.5 media tile, −% badge, hover "Shop Now", tags, name, price. */
export function ProductCard({
  name,
  href,
  image,
  imageAlt,
  tile,
  price,
  was,
  wasLabel,
  discountPercent,
  tags,
  tagsHighlighted,
  family,
  showFamily = false,
  shape = "bottle",
  onAdd,
  added,
  quickLabel = "Shop Now",
  viewLabel,
  addLabel,
  badge,
  actions,
  headingLevel: H = "h3",
  LinkComponent = DefaultLink,
  className,
}: ProductCardProps) {
  return (
    <article className={cx("group relative flex flex-col font-[300]", className)}>
      <div
        style={tintStyle("--sapil-tile", tile)}
        className="relative aspect-[1/1.5] rounded-[18px] bg-sapil-tile overflow-hidden w-full max-749:rounded-[16px]"
      >
        {badge || discountPercent ? (
          <span className="absolute top-[12px] start-[12px] z-[3] bg-sapil-white text-sapil-sale rounded-full py-[5px] px-[10px] text-[12px] font-[700] pointer-events-none">
            {badge ?? `−${discountPercent}%`}
          </span>
        ) : null}
        <LinkComponent
          href={href}
          aria-label={viewLabel ?? `View ${name}`}
          className="absolute inset-0 w-full h-full block [&>img]:w-full [&>img]:h-full [&>img]:object-contain [&>img]:[transition:transform_.45s]"
        >
          {typeof image === "string" ? (
            // eslint-disable-next-line @next/next/no-img-element -- presentational kit; pages may pass next/image instead
            <img src={image} alt={imageAlt ?? `${name} bottle`} loading="lazy" className={PRODUCT_CARD_ZOOM[shape]} />
          ) : (
            image
          )}
        </LinkComponent>
        {actions ? (
          <div className="absolute top-[12px] end-[12px] z-[5] flex flex-col gap-[8px]">{actions}</div>
        ) : null}
        <LinkComponent
          href={href}
          tabIndex={-1}
          aria-hidden="true"
          className="absolute start-[18px] end-[18px] bottom-[16px] z-[4] min-h-[48px] inline-flex items-center justify-center isolate overflow-hidden bg-sapil-white text-sapil-accent border border-sapil-white rounded-[80px] text-[15px] font-[700] opacity-0 [transform:translateY(18px)] [transition:color_.35s,transform_.35s,opacity_.35s] group-hover:opacity-100 group-hover:[transform:none] group-hover:text-sapil-white before:content-[''] before:absolute before:inset-[-24%] before:bg-sapil-accent before:[transform:translateY(118%)_rotate(-4deg)] before:[transition:transform_.6s_cubic-bezier(.22,.61,.36,1)] before:z-[-1] group-hover:before:[transform:translateY(0)_rotate(-4deg)] max-749:hidden"
        >
          {quickLabel}
        </LinkComponent>
        {onAdd && (
          <button
            type="button"
            onClick={onAdd}
            aria-label={addLabel ?? `Add ${name} to bag`}
            className={cx(
              "absolute end-[14px] bottom-[14px] z-[4] w-[48px] h-[48px] rounded-full border border-sapil-white hidden max-749:grid place-items-center [transition:background_.2s,color_.2s] [&_svg]:w-[20px] [&_svg]:h-[20px]",
              added ? "bg-sapil-ok text-sapil-white" : "bg-sapil-white text-sapil-accent hover:bg-sapil-ink hover:text-sapil-white",
            )}
          >
            <PlusIcon />
          </button>
        )}
      </div>
      <div className="pt-[14px]">
        {tags && tags.length > 0 && (
          <div className="flex gap-[8px] flex-wrap mb-[10px]">
            {tags.map((t, i) => (
              <span
                key={i}
                className={cx(
                  "py-[6px] px-[13px] rounded-full text-[11px] leading-[1] uppercase",
                  tagsHighlighted ? "bg-sapil-accent text-sapil-white" : "text-sapil-ink",
                )}
              >
                {t}
              </span>
            ))}
          </div>
        )}
        <H className="m-0 mb-[6px] font-sapil-sans font-[400] text-[16px] leading-[1] tracking-[-.6px] text-sapil-ink max-749:text-[14px]">
          <LinkComponent href={href} className="leading-[1.3] hover:text-sapil-accent">
            {name}
          </LinkComponent>
        </H>
        {showFamily && family && (
          <p className="text-[11px] tracking-[.12em] uppercase text-sapil-muted mt-[2px] mb-[6px]">{family}</p>
        )}
        <Price variant="card" value={price} was={was} wasLabel={wasLabel} />
      </div>
    </article>
  );
}
