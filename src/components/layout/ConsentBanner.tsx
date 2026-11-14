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
  const sapil = brand.themeKey === "sapil";
  // The banner sits outside Sapil's `[data-brand="sapil"]` subtree, where Sapil's colour
  // variables are not defined, so Sapil's accent is given with its value as a fallback.
  const accent = sapil ? "bg-[var(--sapil-accent,#16305c)]" : "bg-terra";
  // Full class names so Tailwind keeps them: the switch track in the brand colour when on.
  const switchOn = sapil
    ? "peer-checked:bg-[var(--sapil-accent,#16305c)]"
    : "peer-checked:bg-terra";
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

  const buttonBase = "cursor-pointer rounded-full px-5 py-2.5 text-center font-medium";
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
        {/* Layout switches use arbitrary properties: Sapil's stylesheet re-emits plain utilities
            (flex-col, grid, w-full …) in a later layer, which would beat the sm: overrides. */}
        <div className="flex gap-3 [flex-direction:column] sm:items-center sm:justify-between sm:[flex-direction:row]">
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
            // Phone: Reject all and Accept all side by side at equal width, Manage choices below.
            <div className="shrink-0 gap-2 [display:grid] [grid-template-columns:repeat(2,minmax(0,1fr))] [width:100%] sm:items-center sm:[display:flex] sm:[width:auto]">
              <button
                type="button"
                onClick={() => {
                  setDraft({ analytics: false, marketing: false });
                  setManaging(true);
                }}
                className={`${buttonBase} underline underline-offset-4 [grid-column:span_2/span_2] [order:9] sm:[order:0]`}
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
                switchOnClass={switchOn}
              />
            ) : null}
            {used.marketing ? (
              <ConsentRow
                title={copy("consentMarketingTitle")}
                body={copy("consentMarketingBody")}
                checked={draft.marketing}
                onChange={(marketing) => setDraft((d) => ({ ...d, marketing }))}
                switchOnClass={switchOn}
              />
            ) : null}
            <div className="gap-2 pt-1 [display:grid] [grid-template-columns:repeat(2,minmax(0,1fr))] sm:justify-end sm:[display:flex]">
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
                className={`${secondary} [grid-column:span_2/span_2] [order:9] sm:[order:0]`}
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
  switchOnClass?: string;
}) {
  const id = useId();
  const fixed = props.onChange === undefined;
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-black/10 px-3 py-2.5">
      <div>
        <label htmlFor={fixed ? undefined : id} className="font-medium">
          {props.title}
        </label>
        <p className="m-0 opacity-80">{props.body}</p>
      </div>
      {fixed ? (
        <span className="shrink-0 text-xs opacity-70">{props.alwaysOnLabel}</span>
      ) : (
        // A real checkbox (keyboard, screen readers, label click) drawn as an on/off toggle.
        <span className="relative inline-flex shrink-0 items-center">
          <input
            id={id}
            type="checkbox"
            role="switch"
            aria-checked={props.checked}
            checked={props.checked}
            onChange={(event) => props.onChange?.(event.target.checked)}
            className="peer absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
          />
          <span
            aria-hidden
            className={`h-6 w-11 rounded-full bg-black/20 transition-colors ${props.switchOnClass ?? ""} peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-current`}
          />
          <span
            aria-hidden
            className="pointer-events-none absolute start-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5 rtl:peer-checked:-translate-x-5"
          />
        </span>
      )}
    </div>
  );
}
