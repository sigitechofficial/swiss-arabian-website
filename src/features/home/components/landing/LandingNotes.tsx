"use client";

import { useRef } from "react";
import { LocaleLink } from "@/lib/i18n/LocaleLink";
import { resolveCatalogImageUrl } from "@/features/catalog/utils/resolveCatalogImageUrl";
import { useFragranceNotes } from "@/features/merchandising";
import { fragranceNotesPlpHref } from "@/features/merchandising/utils/visibleFragranceNoteTiles";
import {
  arrowOutline,
  notesArt,
  notesHead,
  notesItem,
  notesLabel,
  notesShop,
  notesStrip,
  sectionTitle as sectionTitleClass,
  stripArrows,
  stripControls,
} from "@/styles/landingChrome";
import { pageContainer, visuallyHidden } from "@/styles/siteChrome";

export function LandingNotes() {
  const stripRef = useRef<HTMLUListElement>(null);
  const { tiles, sectionTitle, isReady } = useFragranceNotes();

  const scrollBy = (direction: number) => {
    stripRef.current?.scrollBy({ left: direction * 160, behavior: "smooth" });
  };

  if (!isReady || !tiles.length) return null;

  return (
    <section className={notesShop} aria-labelledby="notesTitle">
      <div className={pageContainer}>
        <header className={notesHead}>
          <h2 className={`${sectionTitleClass} mt-0`} id="notesTitle">
            {sectionTitle}
          </h2>
        </header>

        <ul
          className={notesStrip}
          role="list"
          tabIndex={0}
          aria-label={`${sectionTitle}, scrollable`}
          ref={stripRef}
        >
          {tiles.map((tile) => {
            const imageUrl = resolveCatalogImageUrl(tile.imageUrl);
            return (
              <li key={tile.code || tile.fragranceFamily}>
                <LocaleLink className={`${notesItem} group/note`} href={fragranceNotesPlpHref(tile.fragranceFamily)}>
                  <span className={notesArt}>
                    {imageUrl ? <img src={imageUrl} alt="" loading="lazy" /> : null}
                  </span>
                  <span className={notesLabel}>{tile.name}</span>
                </LocaleLink>
              </li>
            );
          })}
        </ul>

        <div className={stripControls}>
          <div className={stripArrows}>
            <button
              className={arrowOutline}
              type="button"
              onClick={() => scrollBy(-1)}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
                aria-hidden="true"
              >
                <path d="M15 5l-7 7 7 7" />
              </svg>
              <span className={visuallyHidden}>Scroll notes left</span>
            </button>
            <button
              className={arrowOutline}
              type="button"
              onClick={() => scrollBy(1)}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
                aria-hidden="true"
              >
                <path d="M9 5l7 7-7 7" />
              </svg>
              <span className={visuallyHidden}>Scroll notes right</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
