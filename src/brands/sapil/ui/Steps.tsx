import type { ReactNode } from "react";
import { CheckIcon, cx } from "./shared";

export type StepState = "done" | "current" | "upcoming";

export type Step = {
  label: ReactNode;
  /** second line, hidden at ≤900px */
  hint?: ReactNode;
  state: StepState;
  /** done steps can be revisited (v9 `.st-btn`); needs selectLabel */
  onSelect?: () => void;
  /** accessible name for the revisit button, e.g. "Bag, done. Open your bag" */
  selectLabel?: string;
};

/** v9 `.steps`: checkout progress tracker. The line after a done step fills navy. */
export function Steps({ steps, label = "Checkout progress", className }: { steps: Step[]; label?: string; className?: string }) {
  return (
    <ol
      aria-label={label}
      className={cx(
        "list-none flex items-center bg-sapil-white rounded-[20px] py-[18px] px-[24px] max-900:py-[14px] max-900:px-[16px] max-900:rounded-[16px]",
        className,
      )}
    >
      {steps.map((s, i) => {
        const body = (
          <>
            <i
              className={cx(
                "flex-none w-[36px] h-[36px] rounded-full grid place-items-center not-italic text-[14px] font-[600] border-[1.5px] [transition:background_.3s_var(--sapil-ease),border-color_.3s_var(--sapil-ease),color_.3s_var(--sapil-ease)] max-900:w-[30px] max-900:h-[30px] max-900:text-[13px] [&_svg]:w-[16px] [&_svg]:h-[16px]",
                s.state === "done" && "bg-sapil-accent border-sapil-accent text-sapil-white",
                s.state === "current" && "bg-sapil-white border-sapil-accent text-sapil-accent shadow-[0_0_0_4px_var(--sapil-accent-soft)]",
                s.state === "upcoming" && "bg-sapil-white border-sapil-line-2",
              )}
            >
              {s.state === "done" ? <CheckIcon /> : <b className="font-[700]">{i + 1}</b>}
            </i>
            <span className={cx("flex flex-col gap-[2px] whitespace-nowrap", s.state !== "current" && "max-900:hidden")}>
              <b className="text-[15px] font-[600]">{s.label}</b>
              {s.hint && <small className="text-[13px] text-sapil-muted max-900:hidden">{s.hint}</small>}
            </span>
          </>
        );
        return (
          <li
            key={i}
            aria-current={s.state === "current" ? "step" : undefined}
            className={cx(
              "flex items-center gap-[12px] flex-1 last:flex-none max-900:gap-[8px]",
              "not-last:after:content-[''] not-last:after:flex-1 not-last:after:h-[2px] not-last:after:rounded-[2px] not-last:after:mx-[18px] max-900:not-last:after:mx-[10px] not-last:after:[transition:background_.4s_var(--sapil-ease)]",
              // every after: utility is behind not-last: — a bare after: would give the last step a ::after too
              s.state === "done" ? "not-last:after:bg-sapil-accent" : "not-last:after:bg-sapil-line",
              s.state === "upcoming" ? "text-sapil-muted" : "text-sapil-ink",
            )}
          >
            {s.state === "done" && s.onSelect ? (
              <button
                type="button"
                onClick={s.onSelect}
                aria-label={s.selectLabel}
                className="flex items-center gap-[12px] text-left rounded-[12px] m-[-6px] p-[6px] [transition:background_.2s_var(--sapil-ease)] hover:bg-sapil-paper max-900:gap-[8px]"
              >
                {body}
              </button>
            ) : (
              body
            )}
          </li>
        );
      })}
    </ol>
  );
}
