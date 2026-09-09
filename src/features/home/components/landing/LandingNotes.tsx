"use client";

import { useRef } from "react";
import Link from "next/link";
import { FRAGRANCE_NOTES } from "../../constants/landingContent";

export function LandingNotes() {
  const stripRef = useRef<HTMLUListElement>(null);

  const scrollBy = (direction: number) => {
    stripRef.current?.scrollBy({ left: direction * 160, behavior: "smooth" });
  };

  return (
    <section className="notes-shop" aria-labelledby="notesTitle">
      <div className="container">
        <header className="section-head">
          <h2 className="display section-head__title" id="notesTitle">
            Shop by Fragrance Notes
          </h2>
        </header>

        <ul
          className="notes-shop__strip"
          role="list"
          tabIndex={0}
          aria-label="Shop by fragrance notes, scrollable"
          ref={stripRef}
        >
          {FRAGRANCE_NOTES.map((note) => (
            <li key={note.label}>
              <Link className="notes-shop__item" href={note.href}>
                <span className="notes-shop__art">
                  <img src={note.image} alt="" loading="lazy" />
                </span>
                <span className="notes-shop__label">{note.label}</span>
              </Link>
            </li>
          ))}
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
