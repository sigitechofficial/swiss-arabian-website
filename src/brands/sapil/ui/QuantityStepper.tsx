import { cx } from "./shared";

export type QuantityStepperProps = {
  value: number;
  onChange: (next: number) => void;
  /** product name, used in the button labels ("Increase Berry Crush") */
  itemLabel: string;
  min?: number;
  max?: number;
  /**
   * "default": bag/summary pill; "big": 58px product-page stepper (`.qty.big`);
   * "tinted": bag line, filled with the bottle's --tile (`.bline .qty`);
   * "compact": 28px buttons (`.co-lines .qty`)
   */
  variant?: "default" | "big" | "tinted" | "compact";
  /** at the minimum, "−" removes the item (bag): label it "Remove …" */
  removeAtMin?: boolean;
  className?: string;
};

/** v9 `.qty`: − count + stepper. */
export function QuantityStepper({
  value,
  onChange,
  itemLabel,
  min = 1,
  max = 99,
  variant = "default",
  removeAtMin = false,
  className,
}: QuantityStepperProps) {
  const big = variant === "big";
  const btn = cx(
    "grid place-items-center",
    big ? "w-[46px] h-[56px] text-[20px]" : variant === "compact" ? "w-[28px] h-[28px] text-[16px]" : "w-[32px] h-[32px] text-[16px]",
    variant === "tinted" && "hover:text-sapil-accent",
    "disabled:opacity-40 disabled:cursor-not-allowed",
  );
  const atMin = value <= min;
  return (
    <span
      role="group"
      aria-label={`Quantity, ${itemLabel}`}
      className={cx(
        "inline-flex items-center border",
        big
          ? "h-[58px] m-0 rounded-[18px] bg-sapil-white border-sapil-line px-[6px]"
          : variant === "compact"
            ? "rounded-full mt-[6px]"
            : "rounded-full mt-[8px]",
        variant === "tinted" ? "bg-sapil-tile border-transparent" : !big && "border-sapil-line-2",
        className,
      )}
    >
      <button
        type="button"
        className={btn}
        disabled={atMin && !removeAtMin}
        aria-label={`${atMin && removeAtMin ? "Remove" : "Decrease"} ${itemLabel}`}
        onClick={() => onChange(value - 1)}
      >
        −
      </button>
      <span
        aria-live="polite"
        className={cx("text-center tabular-nums", big ? "min-w-[28px] text-[16px] font-[600]" : "min-w-[20px] text-[14px]")}
      >
        {value}
      </span>
      <button
        type="button"
        className={btn}
        disabled={value >= max}
        aria-label={`Increase ${itemLabel}`}
        onClick={() => onChange(value + 1)}
      >
        +
      </button>
    </span>
  );
}
