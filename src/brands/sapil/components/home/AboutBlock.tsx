"use client";

import { useId } from "react";
import { MediaImage } from "@/components/ui/MediaImage";
import { toast } from "@/components/ui/Toaster";
import { useNewsletterSignup } from "@/features/newsletter/hooks/useNewsletterSignup";
import { useSapilCopy } from "../../i18n/SapilCopy";
import { Button, Eyebrow, Wrap } from "../../ui";
import { SapilLink } from "../shared/SapilLink";
import type { BrandStory, Newsletter } from "./cmsSections";
import { HomeSection } from "./HomeParts";

/** v9 "About" (BRAND_STORY): photograph, story, three facts, a call to action. */
export function AboutBlock({ story }: { story: BrandStory }) {
  const headingId = useId();
  return (
    <HomeSection id="about" band labelledBy={headingId}>
      <Wrap className="grid grid-cols-[minmax(0,6fr)_minmax(0,5fr)] gap-[72px] items-center max-900:grid-cols-1 max-900:gap-[40px]">
        {story.image ? (
          <div className="relative aspect-[5/6] rounded-[24px] overflow-hidden">
            <MediaImage src={story.image} alt={story.alt} fill sizes="(max-width: 900px) 100vw, 55vw" className="object-cover" />
          </div>
        ) : null}
        <div className={story.image ? undefined : "col-span-full max-w-[720px]"}>
          {story.eyebrow ? <Eyebrow>{story.eyebrow}</Eyebrow> : null}
          <h2 id={headingId} className="text-[clamp(38px,4.4vw,60px)] mt-[14px] mb-[24px]">
            {story.heading}
          </h2>
          {story.paragraphs.map((p, i) => (
            <p key={i} className="text-sapil-ink-2 text-[17px] mb-[16px] max-w-[52ch]">
              {p}
            </p>
          ))}
          {story.stats.length ? (
            <div className="grid grid-cols-3 gap-[24px] my-[36px] pt-[28px] border-t border-sapil-line">
              {story.stats.map((s) => (
                <div key={s.id}>
                  <b className="block font-sapil-serif font-[400] text-[40px] leading-[1] mb-[6px] max-900:text-[32px]">{s.value}</b>
                  <span className="text-[14px] text-sapil-muted">{s.label}</span>
                </div>
              ))}
            </div>
          ) : null}
          {story.cta ? (
            <Button href={story.cta.href} LinkComponent={SapilLink}>
              {story.cta.label}
            </Button>
          ) : null}
        </div>
      </Wrap>
    </HomeSection>
  );
}

/** NEWSLETTER_SIGNUP on the home page (no v9 design: the footer's newsletter, centred). */
export function HomeNewsletter({ newsletter }: { newsletter: Newsletter }) {
  const t = useSapilCopy();
  const id = useId();
  const signup = useNewsletterSignup({
    onSuccess: () => {
      toast(newsletter.successMessage ?? t("home.newsletterThanks"), "success");
      signup.reset();
    },
  });
  return (
    <HomeSection labelledBy={`${id}-h`}>
      <Wrap className="text-center max-w-[640px]">
        {newsletter.eyebrow ? <Eyebrow>{newsletter.eyebrow}</Eyebrow> : null}
        <h2 id={`${id}-h`} className="text-[clamp(34px,4.2vw,56px)] mt-[14px] mb-[12px]">
          {newsletter.heading}
        </h2>
        {newsletter.description ? <p className="text-sapil-ink-2 text-[17px] mb-[24px]">{newsletter.description}</p> : null}
        <form noValidate onSubmit={signup.onSubmit} className="flex gap-[8px] max-w-[420px] mx-auto">
          <label className="sr-only" htmlFor={`${id}-email`}>
            {t("home.newsletterEmail")}
          </label>
          <input
            id={`${id}-email`}
            type="email"
            autoComplete="email"
            required
            value={signup.email}
            onChange={(e) => signup.setEmail(e.target.value)}
            aria-invalid={signup.invalid || undefined}
            aria-describedby={signup.invalid ? `${id}-err` : undefined}
            placeholder={newsletter.placeholder ?? t("home.newsletterPlaceholder")}
            className="flex-1 min-w-0 h-[48px] rounded-full border border-sapil-line-2 bg-sapil-card px-[20px] text-[15px] focus:outline-none focus:border-sapil-ink placeholder:text-[#757575]"
          />
          <Button type="submit">{newsletter.buttonLabel ?? t("home.newsletterButton")}</Button>
        </form>
        {signup.invalid ? (
          <p id={`${id}-err`} role="alert" className="text-[13px] text-sapil-sale mt-[8px]">
            {t("home.newsletterInvalid")}
          </p>
        ) : null}
      </Wrap>
    </HomeSection>
  );
}
