"use client";

import { useEffect, useId, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";

import { PageLoading } from "@/components/ui/PageLoading";
import { LandingHero } from "@/features/home/components/landing/LandingHero";
import { useApiQuery } from "@/lib/api/queryHooks";
import { LocaleLink } from "@/lib/i18n/LocaleLink";
import { localizeHref } from "@/lib/i18n/localePath";
import type { MessageKey, Translator } from "@/lib/i18n/messages";
import { useShopCopy } from "@/lib/i18n/useShopCopy";
import { useAuthStore } from "@/stores/useAuthStore";
import { useUiStore } from "@/stores/useUiStore";

import { getMySubscription, listPlanProducts, listSubscriptionPlans } from "../api/subscription.api";
import { subscriptionKeys } from "../api/subscription.keys";
import type { PublicSubscriptionPlan, SubscriptionAudience, SubscriptionSelectionMode } from "../types/subscription.types";
import {
  audienceChangeNotice,
  retainAudienceSelections,
  subscriptionPriceLines,
} from "../utils/subscriptionRules";
import { subscriptionCheckoutPath } from "../utils/subscriptionCheckout";
import { formatMoney } from "@/lib/format/money";

const QUEUE_LIMIT = 12;
const SECTION_SCROLL = "scroll-mt-[calc(var(--site-header-h,9.25rem)+1rem)]";
const STICKY_TOP = "top-[calc(var(--site-header-h,9.25rem)+1rem)]";
const PANEL_MAX = "max-h-[calc(100vh-var(--site-header-h,9.25rem)-2rem)]";
const TINTS = ["#8c4435", "#6d3428", "#b98a4b", "#5b5148", "#a75a49", "#2c241d"];

function useZoneCode(): string {
  const zoneCode = useUiStore((state) => state.catalogContext?.zoneCode);
  const marketId = useUiStore((state) => state.selectedMarketId);
  return zoneCode || marketId || "";
}

function feeText(plan: PublicSubscriptionPlan, t: Translator): string {
  const price = subscriptionPriceLines(plan, t);
  if (!price.available) return price.message;
  return `${price.subscription}. ${price.shipping}. ${price.total}.`;
}

function tintFor(name: string): string {
  let hash = 0;
  for (let index = 0; index < name.length; index += 1) hash = (hash + name.charCodeAt(index)) % TINTS.length;
  return TINTS[hash] ?? TINTS[0];
}

function Bottle({ tint, className }: { tint: string; className?: string }) {
  return (
    <svg className={className} width="74" height="150" viewBox="0 0 74 150" aria-hidden="true">
      <rect x="27" y="2" width="20" height="22" rx="3" fill="var(--gold, #b98a4b)" />
      <rect x="31" y="24" width="12" height="12" fill="var(--ink-2, #5b5148)" />
      <rect x="5" y="36" width="64" height="110" rx="12" fill="none" stroke="var(--gold, #b98a4b)" strokeWidth="2" />
      <rect x="11" y="72" width="52" height="68" rx="8" fill={tint} />
    </svg>
  );
}

function draftChoices(raw: string): { mode: "choose" | "surprise"; selected: string[] } {
  if (!raw) return { mode: "surprise", selected: [] };
  try {
    const parsed = JSON.parse(raw) as { mode?: string; selected?: unknown };
    const selected = Array.isArray(parsed.selected)
      ? parsed.selected.filter((id): id is string => typeof id === "string")
      : [];
    return { mode: parsed.mode === "QUEUE" ? "choose" : "surprise", selected };
  } catch {
    return { mode: "surprise", selected: [] };
  }
}

function genderFromDraft(raw: string): "men" | "women" | null {
  if (!raw) return null;
  try {
    const audience = (JSON.parse(raw) as { audience?: string }).audience;
    if (audience === "MEN") return "men";
    if (audience === "WOMEN") return "women";
  } catch {
    return null;
  }
  return null;
}

function Check() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="mt-0.5 shrink-0 text-[var(--gold,#b98a4b)]">
      <path d="M5 12l5 5L20 7" />
    </svg>
  );
}

export function SubscriptionsPageView({ lockedPlanCode }: { lockedPlanCode?: string } = {}) {
  const t = useShopCopy();
  const router = useRouter();
  const modeIdPrefix = useId();
  const pathname = usePathname() || "/";
  const zoneCode = useZoneCode();
  const authed = useAuthStore((state) => state.isAuthenticated);
  const bootstrapped = useAuthStore((state) => state.bootstrapped);
  const [pickedCode] = useState<string | null>(lockedPlanCode ?? null);
  const [genderChoice, setGenderChoice] = useState<"men" | "women" | null>(null);
  const [choicePlan, setChoicePlan] = useState("");
  const [modeChoice, setModeChoice] = useState<"choose" | "surprise" | null>(null);
  const [queueChoice, setQueueChoice] = useState<string[] | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [monthsOpen, setMonthsOpen] = useState(false);
  const [audienceRemoved, setAudienceRemoved] = useState(0);
  const [scrollNonce, setScrollNonce] = useState(0);
  const pendingScroll = useRef<string | null>(null);
  const storedAgreementId = useSyncExternalStore(
    () => () => {},
    () => (lockedPlanCode ? sessionStorage.getItem(`sa-sub-agreement:${lockedPlanCode}`) ?? "" : ""),
    () => "",
  );
  const [releasedAgreement, setReleasedAgreement] = useState(false);
  const savedAgreement = useApiQuery(
    subscriptionKeys.detail(storedAgreementId, zoneCode),
    () => getMySubscription(storedAgreementId, zoneCode),
    { enabled: Boolean(storedAgreementId && zoneCode && authed && !releasedAgreement) },
  );
  const agreementId =
    releasedAgreement || (authed && savedAgreement.data?.status !== "PENDING_ACTIVATION")
      ? ""
      : storedAgreementId;

  const plans = useApiQuery(subscriptionKeys.plans(zoneCode), () => listSubscriptionPlans(zoneCode), {
    enabled: Boolean(zoneCode),
  });
  const published = plans.data ?? [];
  const active = lockedPlanCode
    ? published.find((plan) => plan.planCode === lockedPlanCode) ?? null
    : published.find((plan) => plan.planCode === pickedCode) ?? published[0];
  const activePlanCode = active?.planCode ?? "";
  const storedDraft = useSyncExternalStore(
    () => () => {},
    () => (activePlanCode ? sessionStorage.getItem(`sa-sub-draft:${activePlanCode}`) ?? "" : ""),
    () => "",
  );
  const storedGender = genderFromDraft(storedDraft);
  const restored = lockedPlanCode ? draftChoices(storedDraft) : { mode: "surprise" as const, selected: [] as string[] };
  const mode = modeChoice ?? restored.mode;
  const queue = queueChoice ?? restored.selected;
  const gender =
    genderChoice && choicePlan === activePlanCode ? genderChoice : (storedGender ?? "men");
  const audience: SubscriptionAudience = gender === "men" ? "MEN" : "WOMEN";
  // Release a stored agreement the server no longer has pending (decided
  // during render; the flag keeps the decision once the query is disabled).
  const agreementFinished =
    Boolean(lockedPlanCode && storedAgreementId && authed) &&
    (savedAgreement.isError ||
      (savedAgreement.isSuccess && savedAgreement.data.status !== "PENDING_ACTIVATION"));
  if (agreementFinished && !releasedAgreement) setReleasedAgreement(true);
  useEffect(() => {
    if (releasedAgreement && lockedPlanCode) {
      sessionStorage.removeItem(`sa-sub-agreement:${lockedPlanCode}`);
    }
  }, [releasedAgreement, lockedPlanCode]);

  const products = useApiQuery(
    subscriptionKeys.products(active?.planCode ?? "", zoneCode, audience),
    () => listPlanProducts(active!.planCode, zoneCode, audience),
    { enabled: Boolean(zoneCode && active && mode === "choose") },
  );

  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const rows = products.data ?? [];
    if (!needle) return rows;
    return rows.filter((item) => `${item.name} ${item.sku}`.toLowerCase().includes(needle));
  }, [products.data, search]);

  const retained = products.isSuccess && products.data
    ? retainAudienceSelections(queue, products.data.map((item) => item.variantId))
    : { selected: queue, removed: 0 };
  const shownQueue = retained.selected;
  const audienceNotice = audienceChangeNotice(audienceRemoved || retained.removed, t);

  // Picks not offered for the new audience are dropped once and the count is
  // kept for the notice (after this the retained queue removes nothing).
  if (retained.removed > 0) {
    setAudienceRemoved(retained.removed);
    setQueueChoice(retained.selected);
  }

  useEffect(() => {
    const id = pendingScroll.current;
    if (!id) return;
    pendingScroll.current = null;
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [mode, scrollNonce]);

  function scrollToSection(id: string) {
    pendingScroll.current = id;
    setScrollNonce((current) => current + 1);
  }

  function pickMode(value: "choose" | "surprise") {
    if (value === "choose") pendingScroll.current = "favourite-12";
    setModeChoice(value);
    if (value === "choose") setScrollNonce((current) => current + 1);
  }

  function rememberDraft(planCode: string, selected: string[]) {
    const selectionMode: SubscriptionSelectionMode = mode === "surprise" ? "SURPRISE" : "QUEUE";
    sessionStorage.setItem(
      `sa-sub-draft:${planCode}`,
      JSON.stringify({ mode: selectionMode, selected, audience }),
    );
  }

  function selectPlan(planCode: string) {
    if (lockedPlanCode) return;
    const eligible = new Set((products.data ?? []).map((item) => item.variantId));
    const selected = planCode === active?.planCode && mode !== "surprise" ? queue.filter((id) => eligible.has(id)) : [];
    const selectionMode: SubscriptionSelectionMode = mode === "surprise" ? "SURPRISE" : "QUEUE";
    sessionStorage.setItem(
      `sa-sub-draft:${planCode}`,
      JSON.stringify({
        mode: selectionMode,
        selected,
        audience: planCode === activePlanCode ? audience : "MEN",
      }),
    );
    router.push(`/subscriptions/${encodeURIComponent(planCode)}`);
  }

  function toggleFragrance(variantId: string) {
    const eligible = products.data?.map((item) => item.variantId) ?? [];
    const base = eligible.length > 0 ? retainAudienceSelections(queue, eligible).selected : queue;
    const next = base.includes(variantId)
      ? base.filter((id) => id !== variantId)
      : base.length >= QUEUE_LIMIT
        ? base
        : [...base, variantId];
    setQueueChoice(next);
  }

  const activePrice = active ? subscriptionPriceLines(active, t) : null;
  const price = active && activePrice?.available ? formatMoney(activePrice.totalAmount, active.currencyCode) : "";

  function continueWithPlan() {
    if (!active || !activePrice?.available) return;
    const eligible = new Set((products.data ?? []).map((item) => item.variantId));
    const selected = mode === "surprise" ? [] : queue.filter((id) => eligible.has(id));
    rememberDraft(active.planCode, selected);
    if (!lockedPlanCode) {
      router.push(`/subscriptions/${encodeURIComponent(active.planCode)}`);
      return;
    }
    const checkoutPath = subscriptionCheckoutPath(active.planCode);
    if (!authed) {
      router.push(`/login?returnTo=${encodeURIComponent(localizeHref(checkoutPath, pathname))}`);
      return;
    }
    if (!agreementId && mode === "choose" && selected.length < 1) {
      setError(t("subs.rule.addOne"));
      return;
    }
    setError(null);
    router.push(checkoutPath);
  }

  const genderLabel = gender === "men" ? t("subs.club.forHim") : t("subs.club.forHer");
  const modeLine = mode === "choose" ? t("subs.club.modeQueue") : t("subs.club.modeSurprise");
  const remaining = QUEUE_LIMIT - shownQueue.length;
  const queueFull = shownQueue.length >= QUEUE_LIMIT;
  const continueLabel = queueFull
    ? t("subs.club.continueCheckout")
    : t("subs.club.continueWith", { count: shownQueue.length });
  const ring = 2 * Math.PI * 30;
  const dash = `${((ring * shownQueue.length) / QUEUE_LIMIT).toFixed(1)} ${ring.toFixed(1)}`;

  return (
    <div className="bg-[var(--cream,#faf6ee)] text-[var(--ink,#241f1b)]">
      <LandingHero
        eyebrow={t("subs.club.eyebrow")}
        title={t("subs.club.title")}
        lead={t("subs.club.lead")}
        desktopImage="/assets/storefront/banner-shaghaf-powder.jpg"
        primaryCta={{ href: "#plans", label: active ? t("subs.club.startFor", { price }) : t("subs.club.seePlans") }}
        secondaryCta={{ href: "#how", label: t("subs.club.howItWorks") }}
      />

      <section className="mx-auto max-w-[1240px] px-6 pt-24 pb-10" aria-labelledby="why">
        <div className="mb-14 flex flex-col items-center gap-3 text-center">
          <p className="text-[length:var(--fs-eyebrow)] font-semibold tracking-[var(--tracking-wide)] text-[var(--copper,#8c4435)] uppercase">{t("subs.club.whyEyebrow")}</p>
          <h2 id="why" className="m-0 font-[family-name:var(--font-display)] text-[length:var(--fs-h2)] leading-[1.1] font-medium">{t("subs.club.whyTitle")}</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            [t("subs.club.why1Title"), t("subs.club.why1Body")],
            [t("subs.club.why2Title"), active ? t("subs.club.why2BodyPrice", { price }) : t("subs.club.why2Body")],
            [t("subs.club.why3Title"), t("subs.club.why3Body")],
          ].map(([title, body]) => (
            <article key={title} className="flex flex-col gap-4 rounded-[20px] border border-[var(--line,#d9ccb4)] bg-white px-8 py-9">
              <div className="grid size-14 place-items-center rounded-full bg-[var(--cream-2,#f3ebda)] text-[var(--copper,#8c4435)]">
                <Check />
              </div>
              <h3 className="m-0 font-[family-name:var(--font-display)] text-[length:var(--fs-h3)] font-medium">{title}</h3>
              <p className="m-0 text-[length:var(--fs-body)] leading-[var(--leading-body)] text-[var(--ink-2,#5b5148)]">{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="how" className={`mx-auto max-w-[1240px] px-6 pt-16 pb-24 ${SECTION_SCROLL}`} aria-labelledby="how-h">
        <div className="mb-14 flex flex-col items-center gap-3 text-center">
          <p className="text-[length:var(--fs-eyebrow)] font-semibold tracking-[var(--tracking-wide)] text-[var(--copper,#8c4435)] uppercase">{t("subs.club.howItWorks")}</p>
          <h2 id="how-h" className="m-0 font-[family-name:var(--font-display)] text-[length:var(--fs-h2)] leading-[1.1] font-medium">{t("subs.club.howTitle")}</h2>
        </div>
        <ol className="m-0 grid list-none gap-10 p-0 md:grid-cols-3">
          {[
            ["01", t("subs.club.step1Title"), t("subs.club.step1Body")],
            ["02", t("subs.club.step2Title"), t("subs.club.step2Body")],
            ["03", t("subs.club.step3Title"), t("subs.club.step3Body")],
          ].map(([number, title, body]) => (
            <li key={number} className="flex flex-col gap-3.5 border-t-2 border-[var(--ink,#241f1b)] pt-6">
              <div className="font-[family-name:var(--font-display)] text-[length:var(--fs-h1)] leading-none text-[var(--copper,#8c4435)]">{number}</div>
              <h3 className="m-0 text-[length:var(--fs-h4)] font-semibold">{title}</h3>
              <p className="m-0 text-[length:var(--fs-body)] leading-[var(--leading-body)] text-[var(--ink-2,#5b5148)]">{body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section id="plans" className={`${SECTION_SCROLL} bg-[var(--cream-2,#f3ebda)] px-6 py-24`} aria-labelledby="plans-h">
        <div className="mx-auto flex max-w-[1100px] flex-wrap items-stretch gap-12">
          <div className="flex min-w-0 flex-1 basis-[420px] flex-col gap-8">
            <div className="flex flex-col gap-3">
              <p className="text-[length:var(--fs-eyebrow)] font-semibold tracking-[var(--tracking-wide)] text-[var(--copper,#8c4435)] uppercase">{t("subs.club.subscribeNow")}</p>
              <h2 id="plans-h" className="m-0 font-[family-name:var(--font-display)] text-[length:var(--fs-h2)] leading-[1.1] font-medium">{t("subs.club.setupTitle")}</h2>
            </div>

            {!zoneCode ? <p className="text-[length:var(--fs-body)]">{t("subs.club.selectMarket")}</p> : null}
            {plans.isLoading ? <PageLoading label={t("subs.club.loadingPlans")} /> : null}
            {plans.isError ? (
              <p className="text-[length:var(--fs-body)]" role="alert">{t("subs.club.plansFailed")}</p>
            ) : null}
            {plans.isSuccess && published.length === 0 ? (
              <p className="text-[length:var(--fs-body)]">{t("subs.club.noPlans")}</p>
            ) : null}

            {lockedPlanCode && plans.isSuccess && !active ? (
              <p className="text-[length:var(--fs-body)]" role="alert">{t("subs.club.planUnavailable")}</p>
            ) : null}

            {!lockedPlanCode && published.length > 1 ? (
              <fieldset className="m-0 flex flex-col gap-3 border-0 p-0">
                <legend className="mb-3 p-0 text-[length:var(--fs-body)] font-semibold">{t("subs.club.whichPlan")}</legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  {published.map((plan) => {
                    const selected = plan.planCode === active?.planCode;
                    return (
                      <button
                        key={plan.planCode}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => selectPlan(plan.planCode)}
                        className={`flex min-h-24 flex-col gap-1.5 rounded-2xl px-5 py-4 text-left ${selected ? "border-2 border-[var(--ink,#241f1b)] bg-white" : "border-2 border-[var(--line,#d9ccb4)] bg-[var(--cream,#faf6ee)]"}`}
                      >
                        <span className="text-[length:var(--fs-body-lg)] font-semibold">{plan.name}</span>
                        <p className="m-0 text-[length:var(--fs-body)] text-[var(--ink-2,#5b5148)]">{feeText(plan, t)}</p>
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            ) : null}

            <fieldset className="m-0 flex flex-col gap-3 border-0 p-0">
              <legend className="mb-3 p-0 text-[length:var(--fs-body)] font-semibold">{t("subs.club.fragranceType")}</legend>
              <div className="grid max-w-[420px] grid-cols-2 gap-1.5 rounded-full border border-[var(--line,#d9ccb4)] bg-white p-1.5">
                {(["men", "women"] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    aria-pressed={gender === option}
                    onClick={() => {
                      setChoicePlan(activePlanCode);
                      setGenderChoice(option);
                      setAudienceRemoved(0);
                    }}
                    className={`min-h-12 rounded-full text-[length:var(--fs-body)] ${gender === option ? "bg-[var(--ink,#241f1b)] font-semibold text-[var(--cream,#faf6ee)]" : "bg-transparent font-medium text-[var(--ink-2,#5b5148)]"}`}
                  >
                    {option === "men" ? t("subs.audience.men") : t("subs.audience.women")}
                  </button>
                ))}
              </div>
              {audienceNotice ? (
                <p className="m-0 text-[0.82rem] text-[var(--ink-2,#5b5148)]" role="status">
                  {audienceNotice}
                </p>
              ) : null}
            </fieldset>

            <fieldset className="m-0 flex flex-col gap-3 border-0 p-0">
              <legend className="mb-3 p-0 text-[length:var(--fs-body)] font-semibold">{t("subs.club.howPick")}</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                {(
                  [
                    ["surprise", "subs.club.surpriseTitle", "subs.club.surpriseText"],
                    ["choose", "subs.club.chooseTitle", "subs.club.chooseText"],
                  ] as const satisfies readonly (readonly [string, MessageKey, MessageKey])[]
                ).map(([value, titleKey, descriptionKey]) => {
                  const title = t(titleKey);
                  const description = t(descriptionKey);
                  const selected = mode === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={selected}
                      // Name is the short title; the explanation is a description.
                      aria-labelledby={`${modeIdPrefix}-${value}-title`}
                      aria-describedby={`${modeIdPrefix}-${value}-description`}
                      onClick={() => pickMode(value as "choose" | "surprise")}
                      className={`flex min-h-24 flex-col gap-1.5 rounded-2xl px-5 py-4 text-left ${selected ? "border-2 border-[var(--ink,#241f1b)] bg-white" : "border-2 border-[var(--line,#d9ccb4)] bg-[var(--cream,#faf6ee)]"}`}
                    >
                      <span id={`${modeIdPrefix}-${value}-title`} className="text-[length:var(--fs-body-lg)] font-semibold">{title}</span>
                      <span id={`${modeIdPrefix}-${value}-description`} className="text-[0.82rem] leading-normal text-[var(--ink-2,#5b5148)]">{description}</span>
                    </button>
                  );
                })}
              </div>
            </fieldset>
          </div>

          {active ? (
            <div className="flex min-w-0 flex-1 basis-[360px] flex-col gap-5 rounded-3xl bg-[var(--ink,#241f1b)] px-9 py-10 text-[var(--cream,#faf6ee)]">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[length:var(--fs-eyebrow)] font-semibold tracking-[var(--tracking-wide)] text-[var(--gold,#b98a4b)] uppercase">{t("subs.club.monthlyPlan")}</span>
                <span className="rounded-full border border-white/20 px-3 py-1.5 text-[length:var(--fs-eyebrow)]">{genderLabel}</span>
              </div>
              <div className="flex items-baseline gap-2 whitespace-nowrap">
                <span className="font-[family-name:var(--font-display)] text-[length:var(--fs-h1)] leading-none whitespace-nowrap">{activePrice?.available ? formatMoney(activePrice.totalAmount, active.currencyCode) : "—"}</span>
                <span className="text-[length:var(--fs-body)] whitespace-nowrap text-[var(--sand,#ece0c9)]">{t("subs.perMonth")}</span>
              </div>
              <p className="m-0 text-[length:var(--fs-body)] text-[var(--sand,#ece0c9)]">{active.name}</p>
              <p className="m-0 text-[length:var(--fs-body)] text-[var(--sand,#ece0c9)]">
                {activePrice?.available ? `${activePrice.subscription}. ${activePrice.shipping}.` : activePrice?.message}
              </p>
              <ul className="m-0 flex list-none flex-col gap-3 p-0 text-[length:var(--fs-body)] text-[var(--sand,#ece0c9)]">
                {[t("subs.club.featureAtomizer"), modeLine, t("subs.club.featureCourier"), t("subs.club.featureFlexible")].map((line) => (
                  <li key={line} className="flex items-start gap-3"><Check />{line}</li>
                ))}
              </ul>
              {lockedPlanCode && !agreementId && bootstrapped && !authed ? (
                <LocaleLink
                  className="mt-2 flex min-h-14 items-center justify-center rounded-full bg-[var(--gold,#b98a4b)] text-[length:var(--fs-body-lg)] font-semibold text-[var(--ink,#241f1b)]"
                  href={`/login?returnTo=${encodeURIComponent(localizeHref(subscriptionCheckoutPath(active.planCode), pathname))}`}
                >
                  {t("subs.club.signIn")}
                </LocaleLink>
              ) : null}
              {error ? (
                <p className="m-0 text-[0.85rem] text-[var(--sand,#ece0c9)]" role="alert">{error}</p>
              ) : null}
              {!(lockedPlanCode && bootstrapped && !authed) ? (
                <button
                  type="button"
                  onClick={() => {
                    if (!agreementId && mode === "choose" && shownQueue.length === 0) {
                      scrollToSection("favourite-12");
                      return;
                    }
                    continueWithPlan();
                  }}
                  disabled={!activePrice?.available}
                  className="mt-2 flex min-h-14 items-center justify-center rounded-full bg-[var(--gold,#b98a4b)] text-[length:var(--fs-body-lg)] font-semibold whitespace-nowrap text-[var(--ink,#241f1b)] disabled:opacity-50"
                >
                  {agreementId ? t("subs.club.continueCheckout") : mode === "choose" && shownQueue.length === 0 ? t("subs.club.chooseYour12") : t("subs.club.subscribeNow")}
                </button>
              ) : null}
              <p className="m-0 text-center text-[0.82rem] text-[var(--sand,#ece0c9)]">{t("subs.club.shipNote")}</p>
            </div>
          ) : null}
        </div>
      </section>

      {active && mode === "choose" && !agreementId ? (
        <section id="favourite-12" className={`mx-auto max-w-[1240px] px-6 py-24 pb-36 lg:pb-24 ${SECTION_SCROLL}`} aria-labelledby="pick-h">
          <div className="mb-9 flex flex-wrap items-end justify-between gap-6">
            <div className="flex flex-col gap-3">
              <p className="text-[length:var(--fs-eyebrow)] font-semibold tracking-[var(--tracking-wide)] text-[var(--copper,#8c4435)] uppercase">{t("subs.club.queueEyebrow")}</p>
              <h2 id="pick-h" className="m-0 font-[family-name:var(--font-display)] text-[length:var(--fs-h2)] leading-[1.1] font-medium">{t("subs.club.queueTitle")}</h2>
              <p className="m-0 text-[length:var(--fs-body)] text-[var(--ink-2,#5b5148)]">{t("subs.club.queueLead")}</p>
            </div>
            <label className="flex min-h-[52px] min-w-[260px] flex-1 basis-[380px] items-center gap-2.5 rounded-full border border-[var(--line,#d9ccb4)] bg-white px-5">
              <span className="sr-only">{t("subs.club.search")}</span>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t("subs.club.searchPlaceholder")}
                className="min-w-0 flex-1 border-0 bg-transparent text-[length:var(--fs-body)] text-[var(--ink,#241f1b)] outline-none"
              />
            </label>
          </div>

          <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_260px]">
            <div className="flex min-w-0 flex-col gap-5">
              <p className="m-0 text-[length:var(--fs-body)] text-[var(--ink-2,#5b5148)]">
                {products.isSuccess ? t("subs.club.fragranceCount", { count: visible.length }) : t("subs.club.fragrancesForPlan")}
              </p>
              {products.isLoading ? <PageLoading label={t("subs.club.loadingFragrances")} /> : null}
              {products.isError ? <p role="alert">{t("subs.club.fragrancesFailed")}</p> : null}
              {products.isSuccess && visible.length === 0 ? (
                <div className="rounded-[20px] border border-dashed border-[var(--line,#d9ccb4)] px-6 py-12 text-center text-[length:var(--fs-body)] text-[var(--ink-2,#5b5148)]">
                  {search.trim() ? t("subs.club.noMatch") : t("subs.club.noneForAudience")}
                </div>
              ) : null}
              <div className="grid grid-cols-[repeat(auto-fill,minmax(210px,1fr))] gap-5">
                {visible.map((item) => {
                  const position = shownQueue.indexOf(item.variantId);
                  const queued = position >= 0;
                  const full = shownQueue.length >= QUEUE_LIMIT && !queued;
                  return (
                    <article key={item.variantId} className="flex h-full min-w-0 flex-col overflow-hidden rounded-[20px] border border-[var(--line,#d9ccb4)] bg-white">
                      <div className="relative h-48 shrink-0 overflow-hidden bg-[var(--cream-2,#f3ebda)]">
                        {item.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.imageUrl} alt="" className="absolute inset-4 h-[calc(100%-2rem)] w-[calc(100%-2rem)] object-contain" />
                        ) : (
                          <Bottle tint={tintFor(item.name)} className="absolute inset-0 m-auto h-32 w-auto" />
                        )}
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col gap-1 px-3.5 py-3">
                        <h3 className="m-0 line-clamp-2 min-h-[2.7em] overflow-hidden text-[0.82rem] leading-[1.35] font-semibold break-words whitespace-normal" title={item.name}>{item.name}</h3>
                        <p className="m-0 mb-2 truncate text-[0.72rem] text-[var(--ink-2,#5b5148)]">{item.sku}</p>
                        <button
                          type="button"
                          aria-pressed={queued}
                          disabled={full}
                          onClick={() => toggleFragrance(item.variantId)}
                          className={`mt-auto flex min-h-[46px] cursor-pointer items-center justify-center rounded-full border border-[var(--ink,#241f1b)] text-[length:var(--fs-eyebrow)] font-semibold tracking-[0.06em] uppercase disabled:cursor-not-allowed ${queued ? "bg-[var(--ink,#241f1b)] text-[var(--cream,#faf6ee)]" : "bg-white text-[var(--ink,#241f1b)]"} disabled:opacity-50`}
                        >
                          {queued ? t("subs.club.monthN", { month: position + 1 }) : full ? t("subs.club.queueFull") : t("subs.club.addToQueue")}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>

            <aside className={`sticky ${STICKY_TOP} ${PANEL_MAX} hidden min-h-0 flex-col self-start lg:flex`}>
              <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden rounded-[20px] border border-[var(--line,#d9ccb4)] bg-white p-5">
                <div className="flex shrink-0 items-center gap-4">
                  <div className="relative size-[76px] shrink-0" role="img" aria-label={t("subs.club.chosenOf", { chosen: shownQueue.length, limit: QUEUE_LIMIT })}>
                    <svg className="size-full" viewBox="0 0 76 76" aria-hidden="true">
                      <circle cx="38" cy="38" r="30" fill="none" stroke="var(--cream-2, #f3ebda)" strokeWidth="5" />
                      <circle cx="38" cy="38" r="30" fill="none" stroke="var(--copper, #8c4435)" strokeWidth="5" strokeLinecap="round" strokeDasharray={dash} transform="rotate(-90 38 38)" />
                    </svg>
                    <span className="absolute inset-0 flex flex-col items-center justify-center leading-none text-[var(--ink,#241f1b)]">
                      <span className="text-[20px] font-bold tabular-nums">{shownQueue.length}</span>
                      <span className="mt-0.5 text-[10px] font-semibold tracking-[0.08em] text-[var(--ink-2,#5b5148)] uppercase">{t("subs.club.ofLimit", { limit: QUEUE_LIMIT })}</span>
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[length:var(--fs-body-lg)] font-semibold">{t("subs.club.yourQueue")}</span>
                    <span className="text-[0.82rem] text-[var(--ink-2,#5b5148)]">
                      {remaining === 0 ? t("subs.club.allPlanned", { limit: QUEUE_LIMIT }) : t("subs.club.monthsLeft", { count: remaining })}
                    </span>
                  </div>
                </div>
                <span className="shrink-0 text-[length:var(--fs-eyebrow)] font-semibold tracking-[0.14em] uppercase">{t("subs.club.monthsInQueue")}</span>
                <ol className="m-0 flex min-h-0 flex-1 list-none flex-col gap-1 overflow-auto p-0">
                  {Array.from({ length: QUEUE_LIMIT }, (_, index) => {
                    const id = shownQueue[index];
                    const item = products.data?.find((row) => row.variantId === id);
                    return (
                      <li key={index} className="flex min-h-10 min-w-0 items-center gap-3 overflow-hidden border-b border-[var(--cream-2,#f3ebda)]">
                        <span className="w-9 shrink-0 text-[length:var(--fs-eyebrow)] font-semibold text-[var(--copper,#8c4435)]">{t("subs.club.monthShort", { month: index + 1 })}</span>
                        {item ? (
                          <>
                            <span className="size-2.5 shrink-0 rounded-full" style={{ background: tintFor(item.name) }} />
                            <span className="min-w-0 flex-1 truncate text-[0.82rem] font-semibold" title={item.name}>{item.name}</span>
                            <button type="button" aria-label={t("subs.club.remove", { name: item.name })} onClick={() => toggleFragrance(item.variantId)} className="grid h-10 w-8 shrink-0 cursor-pointer place-items-center text-[var(--ink-2,#5b5148)]">×</button>
                          </>
                        ) : (
                          <span className="min-w-0 flex-1 truncate text-[0.82rem] text-[var(--ink-2,#5b5148)] italic">{t("subs.club.perfumersChoice")}</span>
                        )}
                      </li>
                    );
                  })}
                </ol>
                <div className="shrink-0">
                  <button type="button" onClick={continueWithPlan} disabled={shownQueue.length === 0} className="flex min-h-11 w-full items-center justify-center whitespace-nowrap rounded-full bg-[var(--ink,#241f1b)] px-3 text-[0.82rem] font-semibold text-[var(--cream,#faf6ee)] disabled:cursor-not-allowed disabled:opacity-50">
                    {continueLabel}
                  </button>
                  <p className="m-0 mt-2 text-center text-[0.75rem] text-[var(--ink-2,#5b5148)]">{t("subs.club.emptyMonthsNote")}</p>
                </div>
              </div>
            </aside>
          </div>

          {monthsOpen ? (
            <button type="button" aria-label={t("subs.club.closeMonths")} className="fixed inset-0 z-40 bg-[rgba(36,31,27,0.45)] lg:hidden" onClick={() => setMonthsOpen(false)} />
          ) : null}
          <div
            className={`fixed inset-x-0 bottom-[7.75rem] z-50 max-h-[70vh] overflow-auto rounded-t-[20px] border border-[var(--line,#d9ccb4)] bg-white px-4 pt-3 pb-4 shadow-[0_-12px_40px_rgba(36,31,27,0.12)] transition-transform duration-300 ease-out lg:hidden ${monthsOpen ? "translate-y-0" : "pointer-events-none translate-y-[120%]"}`}
            aria-hidden={!monthsOpen}
          >
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[var(--line,#d9ccb4)]" />
            <p className="m-0 mb-2 text-[length:var(--fs-eyebrow)] font-semibold tracking-[0.14em] uppercase">{t("subs.club.monthsInQueue")}</p>
            <ol className="m-0 list-none p-0">
              {Array.from({ length: QUEUE_LIMIT }, (_, index) => {
                const id = shownQueue[index];
                const item = products.data?.find((row) => row.variantId === id);
                return (
                  <li key={index} className="flex min-h-10 items-center gap-3 border-b border-[var(--cream-2,#f3ebda)]">
                    <span className="w-9 shrink-0 text-[length:var(--fs-eyebrow)] font-semibold text-[var(--copper,#8c4435)]">{t("subs.club.monthShort", { month: index + 1 })}</span>
                    {item ? (
                      <>
                        <span className="min-w-0 flex-1 truncate text-[0.82rem] font-semibold">{item.name}</span>
                        <button type="button" aria-label={t("subs.club.remove", { name: item.name })} onClick={() => toggleFragrance(item.variantId)} className="grid h-10 w-8 place-items-center text-[var(--ink-2,#5b5148)]">×</button>
                      </>
                    ) : (
                      <span className="text-[0.82rem] text-[var(--ink-2,#5b5148)] italic">{t("subs.club.perfumersChoice")}</span>
                    )}
                  </li>
                );
              })}
            </ol>
          </div>
          <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--line,#d9ccb4)] bg-[var(--cream,#faf6ee)] lg:hidden">
            <div className="flex items-center justify-between gap-3 px-4 pt-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="relative size-11 shrink-0" role="img" aria-label={t("subs.club.chosenShort", { chosen: shownQueue.length, limit: QUEUE_LIMIT })}>
                  <svg className="size-full" viewBox="0 0 76 76" aria-hidden="true">
                    <circle cx="38" cy="38" r="30" fill="none" stroke="var(--cream-2, #f3ebda)" strokeWidth="5" />
                    <circle cx="38" cy="38" r="30" fill="none" stroke="var(--copper, #8c4435)" strokeWidth="5" strokeLinecap="round" strokeDasharray={dash} transform="rotate(-90 38 38)" />
                  </svg>
                  <span className="absolute inset-0 grid place-items-center text-[12px] font-bold tabular-nums">{shownQueue.length}</span>
                </div>
                <p className="m-0 text-[0.95rem] font-semibold leading-tight">{t("subs.club.yourQueue")}</p>
              </div>
              <button type="button" className="shrink-0 text-[0.82rem] font-semibold text-[var(--copper,#8c4435)] underline" aria-expanded={monthsOpen} onClick={() => setMonthsOpen((open) => !open)}>
                {monthsOpen ? t("subs.club.hideMonths") : t("subs.club.viewMonths")}
              </button>
            </div>
            <div className="flex justify-center px-4 pt-2 pb-3">
              <button type="button" onClick={continueWithPlan} disabled={shownQueue.length === 0} className="flex min-h-11 w-full max-w-[18rem] items-center justify-center whitespace-nowrap rounded-full bg-[var(--ink,#241f1b)] px-4 text-[0.9rem] font-semibold text-[var(--cream,#faf6ee)] disabled:opacity-50">
                {continueLabel}
              </button>
            </div>
          </div>
        </section>
      ) : null}

      {active && mode === "surprise" ? (
        <section id="perfumers" className={`mx-auto flex max-w-[900px] flex-col items-center gap-4 px-6 py-24 text-center ${SECTION_SCROLL}`}>
          <h2 className="m-0 font-[family-name:var(--font-display)] text-[length:var(--fs-h2)] font-medium">{t("subs.club.leaveToPerfumers")}</h2>
          <p className="m-0 max-w-[560px] text-[length:var(--fs-body-lg)] leading-[var(--leading-body)] text-[var(--ink-2,#5b5148)]">
            {gender === "men" ? t("subs.club.perfumersPickMen") : t("subs.club.perfumersPickWomen")}
          </p>
          <button type="button" className="text-[length:var(--fs-body)] font-semibold text-[var(--copper,#8c4435)] underline" onClick={() => pickMode("choose")}>
            {t("subs.club.pickOwnInstead")}
          </button>
        </section>
      ) : null}
    </div>
  );
}
