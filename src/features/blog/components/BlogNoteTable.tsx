import type { NoteRow } from "../data/blogContent";

export function BlogNoteTable({ rows }: { rows: NoteRow[] }) {
  return (
    <div className="w-full border border-sa-border">
      {rows.map((row, index) => (
        <div
          key={row.label}
          className={`flex gap-3 px-4 py-2.5 sm:gap-4 sm:px-6 sm:py-3 ${
            index < rows.length - 1 ? "border-b border-sa-border" : ""
          }`}
        >
          <p className="w-12 shrink-0 text-[10px] font-bold uppercase tracking-[0.18em] text-gold sm:w-[52px] sm:text-[10.5px]">
            {row.label}
          </p>
          <p className="flex-1 text-[13px] leading-[1.6] text-sa-primary sm:text-[15px]">
            {row.notes}
          </p>
        </div>
      ))}
    </div>
  );
}
