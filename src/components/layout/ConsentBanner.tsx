"use client";

import { useEffect, useId, useState, useSyncExternalStore } from "react";
import {
  consentBannerNeeded,
  consentCategoriesInUse,
  getConsent,
  setConsent,
  subscribeConsent,
  subscribeConsentOpen,
  type ConsentChoices,
} from "@/lib/consent/consent";
import { clearTrackingQueue } from "@/lib/analytics/tracker";
import { getBrandConfig } from "@/lib/brand";
import { LocaleLink } from "@/lib/i18n/LocaleLink";
import { useShopCopy } from "@/lib/i18n/useShopCopy";

/**
 * The cookie banner, as shoppers know it from other shops: Accept all, Reject all (equal weight),
 * and Manage choices with one switch per category (Necessary is always on). Shown until the shopper
 * chooses, and again from the footer's "Cookie settings". Only categories this site actually uses
 * are offered, and the banner does not appear at all when nothing optional is switched on.
 *
 * What each choice controls lives in `@/lib/consent`: analytics = our tracker and Google tags;
 * marketing = Insider and personalised popups. Turning a category off after it ran reloads the page,
 * because scripts that already loaded cannot be unloaded.
 *
 * The server snapshot is "decided", so the server-rendered page and the first client render match;
 * the real answer is read from this browser right after.
 */
const undecidedSnapshot = () => consentBannerNeeded() && getConsent() === null;

export function ConsentBanner() {
  const copy = useShopCopy();
  // Each brand's own privacy page and accent colour (one deployment per brand).
  const brand = getBrandConfig();
  const accent = brand.themeKey === "sapil" ? "bg-sapil-accent" : "bg-terra";
  const undecided = useSyncExternalStore(subscribeConsent, undecidedSnapshot, () => false);
  const [reopened, setReopened] = useState(false);
  const [managing, setManaging] = useState(false);
  const [draft, setDraft] = useState<ConsentChoices>({ analytics: false, marketing: false });
  const titleId = useId();

  useEffect(
    () =>
      subscribeConsentOpen(() => {
        const current = getConsent();
        setDraft({ analytics: current?.analytics ?? false, marketing: current?.marketing ?? false });
        setManaging(true);
        setReopened(true);
      }),
    [],
  );

  if (!undecided && !reopened) return null;

  const used = consentCategoriesInUse();

  const save = (choices: ConsentChoices) => {
    const revoked = setConsent(choices);
    if (!choices.analytics) clearTrackingQueue();
    setReopened(false);
    setManaging(false);
    if (revoked) window.location.reload();
  };

  const buttonBase = "cursor-pointer rounded-full px-5 py-2.5 font-medium";
  const secondary = `${buttonBase} border border-black/20`;
  const primary = `${buttonBase} ${accent} text-white`;

  return (
    <section
      role="region"
      aria-labelledby={titleId}
      data-consent-banner
      // Above the on-site banner (z-210) and popup backdrop (z-220): this choice comes first.
      className="fixed inset-x-0 bottom-0 z-[230] max-h-[85dvh] overflow-y-auto border-t border-black/10 bg-page px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-sm text-sa-primary shadow-[0_-4px_16px_rgba(0,0,0,0.08)]"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="m-0 max-w-3xl">
            <strong id={titleId} className="font-medium">
              {copy("consentTitle")}
            </strong>{" "}
            <span className="opacity-80">{copy("consentBody")}</span>{" "}
            <LocaleLink href={brand.legal.privacy} className="underline">
              {copy("consentLearnMore")}
            </LocaleLink>
          </p>
          {managing ? null : (
            <div className="flex shrink-0 flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setDraft({ analytics: false, marketing: false });
                  setManaging(true);
                }}
                className={`${buttonBase} underline underline-offset-4`}
              >
                {copy("consentManage")}
              </button>
              <button
                type="button"
                onClick={() => save({ analytics: false, marketing: false })}
                className={secondary}
              >
                {copy("consentDecline")}
              </button>
              <button
                type="button"
                onClick={() => save({ analytics: used.analytics, marketing: used.marketing })}
                className={primary}
              >
                {copy("consentAccept")}
              </button>
            </div>
          )}
        </div>

        {managing ? (
          <div className="flex flex-col gap-2" data-consent-choices>
            <ConsentRow
              title={copy("consentNecessaryTitle")}
              body={copy("consentNecessaryBody")}
              alwaysOnLabel={copy("consentAlwaysOn")}
            />
            {used.analytics ? (
              <ConsentRow
                title={copy("consentAnalyticsTitle")}
                body={copy("consentAnalyticsBody")}
                checked={draft.analytics}
                onChange={(analytics) => setDraft((d) => ({ ...d, analytics }))}
              />
            ) : null}
            {used.marketing ? (
              <ConsentRow
                title={copy("consentMarketingTitle")}
                body={copy("consentMarketingBody")}
                checked={draft.marketing}
                onChange={(marketing) => setDraft((d) => ({ ...d, marketing }))}
              />
            ) : null}
            <div className="flex flex-wrap justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => save({ analytics: false, marketing: false })}
                className={secondary}
              >
                {copy("consentDecline")}
              </button>
              <button
                type="button"
                onClick={() =>
                  save({
                    analytics: used.analytics && draft.analytics,
                    marketing: used.marketing && draft.marketing,
                  })
                }
                className={secondary}
              >
                {copy("consentSave")}
              </button>
              <button
                type="button"
                onClick={() => save({ analytics: used.analytics, marketing: used.marketing })}
                className={primary}
              >
                {copy("consentAccept")}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function ConsentRow(props: {
  title: string;
  body: string;
  checked?: boolean;
  onChange?: (value: boolean) => void;
  alwaysOnLabel?: string;
}) {
  const id = useId();
  const fixed = props.onChange === undefined;
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-black/10 px-3 py-2.5">
      <div>
        <label htmlFor={fixed ? undefined : id} className="font-medium">
          {props.title}
        </label>
        <p className="m-0 opacity-80">{props.body}</p>
      </div>
      {fixed ? (
        <span className="shrink-0 text-xs opacity-70">{props.alwaysOnLabel}</span>
      ) : (
        <input
          id={id}
          type="checkbox"
          role="switch"
          aria-checked={props.checked}
          checked={props.checked}
          onChange={(event) => props.onChange?.(event.target.checked)}
          className="mt-1 h-5 w-5 shrink-0 cursor-pointer accent-current"
        />
      )}
    </div>
  );
}
