"use client";

import { useRef } from "react";
import Link from "next/link";
import { resolveCatalogImageUrl } from "@/features/catalog/utils/resolveCatalogImageUrl";
import { useFragranceNotes } from "@/features/merchandising";
import { fragranceNotesPlpHref } from "@/features/merchandising/utils/visibleFragranceNoteTiles";

export function LandingNotes() {
  const stripRef = useRef<HTMLUListElement>(null);
  const { tiles, sectionTitle, isReady } = useFragranceNotes();

  const scrollBy = (direction: number) => {
    stripRef.current?.scrollBy({ left: direction * 160, behavior: "smooth" });
  };

  if (!isReady || !tiles.length) return null;

  return (
    <section className="notes-shop" aria-labelledby="notesTitle">
      <div className="container">
        <header className="section-head">
          <h2 className="display section-head__title" id="notesTitle">
            {sectionTitle}
          </h2>
        </header>

        <ul
          className="notes-shop__strip"
          role="list"
          tabIndex={0}
          aria-label={`${sectionTitle}, scrollable`}
          ref={stripRef}
        >
          {tiles.map((tile) => {
            const imageUrl = resolveCatalogImageUrl(tile.imageUrl);
            return (
              <li key={tile.code || tile.fragranceFamily}>
                <Link className="notes-shop__item" href={fragranceNotesPlpHref(tile.fragranceFamily)}>
                  <span className="notes-shop__art">
                    {imageUrl ? <img src={imageUrl} alt="" loading="lazy" /> : null}
                  </span>
                  <span className="notes-shop__label">{tile.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="strip-controls">
          <div className="strip-controls__arrows">
            <button
              className="arrow arrow--outline"
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
              <span className="visually-hidden">Scroll notes left</span>
            </button>
            <button
              className="arrow arrow--outline"
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
              <span className="visually-hidden">Scroll notes right</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
