/** Product page reviews section (Option C: stats column + reviews in 3 columns). */

export const rvGrid =
  "grid grid-cols-1 gap-5 min-[900px]:grid-cols-4 min-[900px]:items-stretch";

export const rvSummary =
  "flex flex-col rounded-lg border border-[#e6dccb] bg-[#fffdf8] px-[22px] pt-[22px] pb-5 min-[900px]:col-start-1 min-[900px]:row-start-1 min-[900px]:row-span-2";

export const rvAvg = "flex items-baseline gap-2.5";
export const rvAvgNum =
  "font-[family-name:var(--font-display)] text-[3.2rem] leading-none font-light tracking-[-0.02em]";
export const rvCount = "mt-2 mb-[18px] text-[0.72rem] leading-[1.55] text-[var(--ink-2,#5b5148)]";

export const rvBars = "mb-[18px] grid gap-2";
export const rvBar =
  "grid cursor-pointer grid-cols-[28px_1fr_22px] items-center gap-2.5 border-0 bg-transparent p-0 text-start text-[0.72rem] text-[var(--ink,#241f1b)] disabled:cursor-default";
export const rvBarOn = "font-semibold text-copper!";
export const rvBarTrack = "h-1.5 overflow-hidden rounded-full bg-[#ece3d2]";
export const rvBarFill = "block h-full rounded-full bg-[var(--gold,#b98a4b)]";
export const rvBarN = "text-end text-[var(--ink-2,#5b5148)]";

export const rvNote = "mt-auto pt-3.5 text-[0.66rem] leading-[1.6] text-[var(--ink-2,#5b5148)]";

export const rvTools =
  "flex flex-wrap items-center justify-between gap-3 border-b border-[#e6dccb] pb-3.5 min-[900px]:col-start-2 min-[900px]:col-span-3 min-[900px]:row-start-1 min-[900px]:self-start";
export const rvChips = "flex flex-wrap gap-2";
export const rvChip =
  "cursor-pointer rounded-full border border-[var(--line,#d9ccb4)] bg-transparent px-3.5 py-[7px] text-[0.68rem] tracking-[0.03em] whitespace-nowrap text-[var(--ink,#241f1b)] hover:border-[var(--ink,#241f1b)]";
export const rvChipOn = "border-[var(--ink,#241f1b)]! bg-[var(--ink,#241f1b)]! text-white!";
export const rvSort =
  "flex items-center gap-2 text-[0.68rem] whitespace-nowrap text-[var(--ink-2,#5b5148)] [&_select]:cursor-pointer [&_select]:rounded-full [&_select]:border [&_select]:border-[var(--line,#d9ccb4)] [&_select]:bg-[#fffdf8] [&_select]:px-3 [&_select]:py-1.5 [&_select]:text-[0.7rem] [&_select]:text-[var(--ink,#241f1b)] [&_select]:[font-family:inherit]";

export const rvCard =
  "flex min-w-0 flex-col gap-2 rounded-lg bg-[#f3f0ea] px-[18px] pt-[18px] pb-3.5";
export const rvCardTop = "flex items-center justify-between gap-2";
export const rvDate = "text-[0.64rem] text-[var(--ink-2,#5b5148)]";
export const rvTitle = "m-0 mt-0.5 text-[0.95rem] font-semibold";
export const rvBody = "m-0 line-clamp-6 text-[0.82rem] leading-[1.55] break-words whitespace-pre-line";
export const rvReply =
  "rounded-e-md border-s-2 border-copper bg-[#fffdf8] px-2.5 py-2 text-[0.74rem] leading-[1.5] text-[var(--ink-2,#5b5148)]";
export const rvReplyLabel =
  "mb-0.5 block text-[0.6rem] font-semibold tracking-[0.1em] text-[var(--ink,#241f1b)] uppercase";
export const rvReplyText = "line-clamp-2";
export const rvMore =
  "cursor-pointer self-start border-0 bg-transparent p-0 text-[0.7rem] text-copper underline underline-offset-[3px]";
export const rvWho =
  "mt-auto flex flex-wrap items-center gap-x-2.5 gap-y-1 border-t border-[#e4dccd] pt-2 text-[0.62rem] font-medium tracking-[0.06em] text-[var(--ink-2,#5b5148)] uppercase";
export const rvActions =
  "flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.66rem] text-[var(--ink-2,#5b5148)]";
export const rvAction =
  "cursor-pointer border-0 bg-transparent p-0 text-[0.66rem] text-[var(--ink-2,#5b5148)] underline-offset-[3px] hover:text-copper hover:underline disabled:cursor-default disabled:no-underline disabled:opacity-70";
export const rvActionOn = "font-semibold text-copper";
export const rvVerified = "inline-flex items-center gap-1.5 text-[#2e6b3f]";
export const rvVerifiedDot =
  "grid size-[13px] place-items-center rounded-full bg-[#2e6b3f] text-[8px] text-white";

export const rvFoot = "col-span-full pt-2 text-center";
export const rvFootCount = "mb-2.5 text-[0.68rem] text-[var(--ink-2,#5b5148)]";

export const rvBtn =
  "inline-flex min-h-11 w-full cursor-pointer items-center justify-center rounded-full border-0 bg-copper px-6 text-[0.72rem] font-medium tracking-[0.08em] text-white uppercase hover:bg-copper-deep disabled:opacity-60";
export const rvBtnLine =
  "inline-flex min-h-11 cursor-pointer items-center justify-center rounded-full border border-[var(--ink,#241f1b)] bg-transparent px-6 text-[0.72rem] font-medium tracking-[0.08em] text-[var(--ink,#241f1b)] uppercase hover:bg-[var(--ink,#241f1b)] hover:text-white";

export const rvEmpty =
  "rounded-lg border border-dashed border-[var(--line,#d9ccb4)] bg-[#fffdf8] px-6 py-8 text-center text-[0.9rem] leading-[1.6] text-[var(--ink-2,#5b5148)]";

/* Read more (dialog) */
export const rvDialogWrap = "fixed inset-0 z-[1300] grid place-items-center p-4";
export const rvDialogScrim =
  "absolute inset-0 cursor-pointer border-0 bg-[rgba(24,20,17,0.45)] backdrop-blur-[4px]";
export const rvDialog =
  "relative max-h-[85vh] w-full max-w-[560px] overflow-y-auto rounded-lg bg-[#fffdf8] px-7 pt-7 pb-6 shadow-[0_30px_70px_rgba(0,0,0,0.25)]";
export const rvDialogClose =
  "absolute end-4 top-3 cursor-pointer border-0 bg-transparent text-[1.5rem] leading-none text-[var(--ink-2,#5b5148)]";
export const rvDialogBody = "m-0 text-[0.95rem] leading-[1.75] break-words whitespace-pre-line";

/* Write a review (side panel) */
export const rvPanel =
  "flex h-full w-[min(520px,100vw)] flex-col overflow-y-auto bg-[var(--cream,#faf6ee)] text-[var(--ink,#241f1b)]";
export const rvPanelHead = "flex items-start gap-4 border-b border-[#e6dccb] px-7 pt-7 pb-5";
export const rvPanelTitle =
  "m-0 mt-1 font-[family-name:var(--font-display)] text-[1.5rem] leading-[1.15] font-light";
export const rvPanelBody = "grid gap-[18px] px-7 py-6";
export const rvPick = "flex items-center gap-0.5";
export const rvPickStar =
  "size-10 cursor-pointer border-0 bg-transparent p-0 text-[1.6rem] leading-none";
/** Separate on/off colours (one class each) so the filled stars always win. */
export const rvPickStarOn = "text-[var(--gold,#b98a4b)]!";
export const rvPickStarOff = "text-[var(--line,#d9ccb4)]!";
export const rvPickLabel = "ms-2.5 text-[0.75rem] text-[var(--ink-2,#5b5148)]";
export const rvHint = "mt-1 flex justify-between text-[0.66rem] text-[var(--ink-2,#5b5148)]";
export const rvErr = "text-[0.72rem] text-[#b42318]";
export const rvSmall = "text-[0.7rem] leading-[1.6] text-[var(--ink-2,#5b5148)]";
