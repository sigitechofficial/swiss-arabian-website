import type { ReactNode } from "react";
import { DefaultLink, tintStyle, type SapilLinkComponent, type SapilTint } from "./shared";
import { QuantityStepper } from "./QuantityStepper";

export type BagLineProps = {
  name: string;
  href: string;
  /** omitted: the tile shows without a bottle */
  imageSrc?: string;
  /** e.g. "Juicy Pleasures · AED 63 each" */
  detail: ReactNode;
  tile?: SapilTint;
  quantity: number;
  onQuantityChange: (next: number) => void;
  /** line total, formatted */
  total: ReactNode;
  /** struck-out full line price */
  was?: ReactNode;
  onRemove: () => void;
  /** most the line can hold (stock); the + button stops there */
  max?: number;
  /** quantity can't change (e.g. the item is unavailable) */
  disabled?: boolean;
  /** extra lines under the stepper: bundle tags, stock notes */
  extra?: ReactNode;
  /** translated wording; default English */
  labels?: {
    remove?: string;
    removeItem?: string;
    was?: string;
    stepper?: { group?: string; decrease?: string; increase?: string; remove?: string };
  };
  LinkComponent?: SapilLinkComponent;
};

/** v9 `.bline`: one bag line in the drawer (tile, serif name, tinted stepper, total, Remove). */
export function BagLine({
  name,
  href,
  imageSrc,
  detail,
  tile,
  quantity,
  onQuantityChange,
  total,
  was,
  onRemove,
  max,
  disabled,
  extra,
  labels,
  LinkComponent = DefaultLink,
}: BagLineProps) {
  return (
    <div
      style={tintStyle("--sapil-tile", tile)}
      className="grid grid-cols-[72px_1fr_auto] gap-[14px] py-[16px] border-b border-sapil-line items-center"
    >
      <LinkComponent
        href={href}
        tabIndex={-1}
        aria-hidden="true"
        className="aspect-square rounded-sapil-sm bg-sapil-tile grid place-items-center"
      >
        {imageSrc ? (
          // eslint-disable-next-line @next/next/no-img-element -- presentational kit
          <img src={imageSrc} alt="" className="h-[84%] object-contain" />
        ) : null}
      </LinkComponent>
      <div>
        <LinkComponent href={href} className="block [transition:color_.18s] hover:text-sapil-accent">
          <b className="font-sapil-serif font-[400] text-[18px] block leading-[1.2]">{name}</b>
        </LinkComponent>
        <small className="text-[13px] text-sapil-muted">{detail}</small>
        <br />
        <QuantityStepper
          variant="tinted"
          value={quantity}
          onChange={onQuantityChange}
          itemLabel={name}
          min={1}
          max={max}
          removeAtMin
          disabled={disabled}
          labels={labels?.stepper}
        />
        {extra}
      </div>
      <div className="text-end">
        <span className="font-[600] tabular-nums">
          {total}
          {was && (
            <s className="block text-[13px] font-[400] text-sapil-muted">
              <span className="sr-only">{labels?.was ?? "was"} </span>
              {was}
            </s>
          )}
        </span>
        <button
          type="button"
          onClick={onRemove}
          aria-label={labels?.removeItem ?? `Remove ${name}`}
          className="block ms-auto mt-[6px] text-[13px] text-sapil-muted underline"
        >
          {labels?.remove ?? "Remove"}
        </button>
      </div>
    </div>
  );
}
