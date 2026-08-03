"use client";

import type { FormEvent } from "react";
import { useState } from "react";

export function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim()) return;
    setSubmitted(true);
  }

  return (
    <section
      className="bg-cream py-20 text-center dark:bg-section-soft"
      aria-label="Newsletter"
    >
      <div className="mx-auto max-w-xl px-4 sm:px-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-gold">
          The List
        </p>
        <h2 className="mt-3 font-sans text-3xl font-medium tracking-tight text-sa-primary lg:text-4xl">
          Be first to every new accord
        </h2>
        <p className="mx-auto mt-3 max-w-md text-[14px] leading-relaxed text-sa-muted">
          Launches, limited editions and members-only offers — straight to your
          inbox.
        </p>
        {submitted ? (
          <p className="mt-7 text-[14px] font-medium text-sa-primary" role="status">
            Thanks — we&apos;ll be in touch.
          </p>
        ) : (
          <form
            className="mx-auto mt-7 flex max-w-md overflow-hidden border border-bone bg-surface"
            onSubmit={onSubmit}
          >
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              aria-label="Email address"
              className="min-w-0 flex-1 bg-transparent px-5 py-3 text-[14px] text-sa-primary outline-none placeholder:text-sa-muted"
            />
            <button
              type="submit"
              className="shrink-0 bg-inverse px-7 text-[13px] font-semibold text-cream transition-colors hover:opacity-90"
            >
              Sign up
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
