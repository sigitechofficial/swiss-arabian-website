/**
 * Blog / policy typography from the v9 system (no v9 article design): Poppins
 * body in ink-2, Fraunces headings, navy links, pastel tables and quotes.
 * Applied to a wrapper around CMS / store HTML.
 */
export const SAPIL_PROSE = [
  "text-[16px] leading-[1.75] text-sapil-ink-2",
  "[&>*+*]:mt-[1em]",
  "[&_h2]:font-sapil-serif [&_h2]:text-sapil-ink [&_h2]:text-[clamp(26px,2.6vw,34px)] [&_h2]:leading-[1.15] [&_h2]:tracking-[-.02em] [&_h2]:mt-[1.6em]",
  "[&_h3]:font-sapil-serif [&_h3]:text-sapil-ink [&_h3]:text-[22px] [&_h3]:leading-[1.2] [&_h3]:mt-[1.4em]",
  "[&_h4]:font-[600] [&_h4]:text-sapil-ink [&_h4]:mt-[1.2em]",
  "[&_strong]:text-sapil-ink [&_b]:text-sapil-ink",
  "[&_a]:text-sapil-accent [&_a]:font-[600] [&_a]:underline [&_a]:underline-offset-[3px]",
  "[&_ul]:list-disc [&_ul]:ps-[1.4em] [&_ol]:list-decimal [&_ol]:ps-[1.4em] [&_li+li]:mt-[.35em]",
  "[&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-[16px]",
  "[&_iframe]:w-full [&_iframe]:aspect-video [&_iframe]:h-auto [&_iframe]:rounded-[16px]",
  "[&_blockquote]:border-s-[3px] [&_blockquote]:border-sapil-accent [&_blockquote]:ps-[1em] [&_blockquote]:font-sapil-serif [&_blockquote]:italic [&_blockquote]:text-[20px] [&_blockquote]:text-sapil-ink",
  "[&_table]:w-full [&_table]:border-collapse [&_table]:block [&_table]:overflow-x-auto",
  "[&_th]:bg-sapil-p-sand [&_th]:text-start [&_th]:p-[.6em_.8em] [&_th]:border [&_th]:border-sapil-line [&_td]:p-[.6em_.8em] [&_td]:border [&_td]:border-sapil-line [&_td]:align-top",
  "[&_hr]:border-0 [&_hr]:border-t [&_hr]:border-sapil-line",
].join(" ");
