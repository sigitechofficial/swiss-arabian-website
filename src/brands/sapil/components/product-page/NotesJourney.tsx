import { MediaImage } from "@/components/ui/MediaImage";
import type { SapilTranslator } from "../../i18n/SapilCopy";
import { Wrap } from "../../ui";
import { tintStyle } from "../../ui/shared";
import { noteTone, type NoteRow } from "./notes";

/**
 * The notes as a journey, first spray to dry-down (v9 product page, version B
 * extras; styled with the v9 tokens). One card per layer: a photo when the
 * product has lifestyle shots (3rd image on), else the first note in italics.
 */
export function NotesJourney({ rows, photos, t }: { rows: NoteRow[]; photos: string[]; t: SapilTranslator }) {
  if (!rows.length) return null;
  const title = { top: t("product.journeyTop"), heart: t("product.journeyHeart"), base: t("product.journeyBase") };
  const sub = { top: t("product.journeyTopSub"), heart: t("product.journeyHeartSub"), base: t("product.journeyBaseSub") };
  return (
    <section
      aria-labelledby="journey-heading"
      className="bg-[linear-gradient(180deg,var(--sapil-accent-soft),var(--sapil-white))] py-[72px] max-900:py-[48px]"
    >
      <Wrap>
        <div className="text-center mb-[36px]">
          <h2 id="journey-heading" className="text-[clamp(26px,2.6vw,36px)]">
            {t("product.journeyTitle")}
          </h2>
          <p className="text-sapil-ink-2 uppercase tracking-[.18em] text-[12px] mt-[10px]">{t("product.journeySub")}</p>
        </div>
        <div className="grid grid-cols-3 gap-[20px] max-900:grid-cols-1">
          {rows.map((row, i) => {
            const tone = noteTone(row.notes[0]);
            const photo = photos[i];
            return (
              <article key={row.layer} className="bg-sapil-white rounded-[24px] overflow-hidden shadow-[0_18px_40px_-28px_rgba(13,33,82,.35)]">
                <div style={tintStyle("--nc", tone.color)} className="relative aspect-[4/3] bg-[var(--nc)] overflow-hidden grid place-items-center">
                  {photo ? (
                    <MediaImage src={photo} alt="" fill sizes="(max-width: 900px) 100vw, 460px" className="object-cover" />
                  ) : (
                    <span aria-hidden="true" className="font-sapil-serif italic text-[clamp(36px,3.4vw,52px)] text-sapil-accent">
                      {row.notes[0]}
                    </span>
                  )}
                </div>
                <div className="pt-[20px] px-[22px] pb-[24px]">
                  <h3 className="text-[15px] tracking-[.16em]">{title[row.layer]}</h3>
                  <small className="block text-[12px] text-sapil-muted uppercase tracking-[.12em] mt-[4px] mb-[14px] pb-[12px] border-b border-sapil-line">
                    {sub[row.layer]}
                  </small>
                  <ul className="list-none grid gap-[10px] p-0">
                    {row.notes.map((note) => {
                      const nt = noteTone(note);
                      return (
                        <li key={note} className="flex items-center gap-[12px] text-[15px]">
                          <i
                            aria-hidden="true"
                            style={tintStyle("--nc", nt.color)}
                            className="w-[34px] h-[34px] rounded-full bg-[var(--nc)] grid place-items-center not-italic text-[14px] text-sapil-ink-2 flex-none"
                          >
                            {nt.glyph}
                          </i>
                          {note}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </article>
            );
          })}
        </div>
      </Wrap>
    </section>
  );
}
