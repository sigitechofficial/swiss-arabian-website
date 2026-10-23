"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";

import { PageLoading } from "@/components/ui/PageLoading";
import { LandingHero } from "@/features/home/components/landing/LandingHero";
import { useApiQuery } from "@/lib/api/queryHooks";
import { LocaleLink } from "@/lib/i18n/LocaleLink";
import { localizeHref } from "@/lib/i18n/localePath";
import { useAuthStore } from "@/stores/useAuthStore";
import { useUiStore } from "@/stores/useUiStore";

import { listPlanProducts, listSubscriptionPlans } from "../api/subscription.api";
import { subscriptionKeys } from "../api/subscription.keys";
import type { PublicSubscriptionPlan, SubscriptionAudience, SubscriptionSelectionMode } from "../types/subscription.types";
import {
  audienceChangeNotice,
  retainAudienceSelections,
  subscriptionPriceLines,
} from "../utils/subscriptionRules";
import { subscriptionCheckoutPath } from "../utils/subscriptionCheckout";

const QUEUE_LIMIT = 12;
const TINTS = ["#8c4435", "#6d3428", "#b98a4b", "#5b5148", "#a75a49", "#2c241d"];

function useZoneCode(): string {
  const zoneCode = useUiStore((state) => state.catalogContext?.zoneCode);
  const marketId = useUiStore((state) => state.selectedMarketId);
  return zoneCode || marketId || "";
}

function feeText(plan: PublicSubscriptionPlan): string {
  const price = subscriptionPriceLines(plan);
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
  if (!raw) return { mode: "choose", selected: [] };
  try {
    const parsed = JSON.parse(raw) as { mode?: string; selected?: unknown };
    const selected = Array.isArray(parsed.selected)
      ? parsed.selected.filter((id): id is string => typeof id === "string")
      : [];
    return { mode: parsed.mode === "SURPRISE" ? "surprise" : "choose", selected };
  } catch {
    return { mode: "choose", selected: [] };
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
  const router = useRouter();
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
  const agreementId = useSyncExternalStore(
    () => () => {},
    () => (lockedPlanCode ? sessionStorage.getItem(`sa-sub-agreement:${lockedPlanCode}`) ?? "" : ""),
    () => "",
  );

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
  const restored = lockedPlanCode ? draftChoices(storedDraft) : { mode: "choose" as const, selected: [] as string[] };
  const mode = modeChoice ?? restored.mode;
  const queue = queueChoice ?? restored.selected;
  const gender =
    genderChoice && choicePlan === activePlanCode ? genderChoice : (storedGender ?? "men");
  const audience: SubscriptionAudience = gender === "men" ? "MEN" : "WOMEN";
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
  const audienceNotice = audienceChangeNotice(retained.removed);

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

  const activePrice = active ? subscriptionPriceLines(active) : null;
  const price = activePrice?.available ? `${active.currencyCode} ${activePrice.totalAmount}` : "";

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
      setError("Add at least one fragrance.");
      return;
    }
    setError(null);
    router.push(checkoutPath);
  }

  const genderLabel = gender === "men" ? "For him" : "For her";
  const modeLine = mode === "choose" ? "Your own queue of up to 12 picks" : "Hand-picked by our perfumers";
  const remaining = QUEUE_LIMIT - shownQueue.length;
  const ring = 2 * Math.PI * 32;
  const dash = `${((ring * shownQueue.length) / QUEUE_LIMIT).toFixed(1)} ${ring.toFixed(1)}`;

  return (
    <div className="bg-[var(--cream,#faf6ee)] text-[var(--ink,#241f1b)]">
      <LandingHero
        eyebrow="The Scent Club · Monthly subscription"
        title="A new signature, every month."
        lead="Discover a different fragrance each month in a 10 ml refillable atomizer. Pick your own twelve, or let our perfumers surprise you."
        desktopImage="/assets/storefront/banner-shaghaf-powder.jpg"
        primaryCta={{ href: "#plans", label: active ? `Start for ${price}` : "See the plans" }}
        secondaryCta={{ href: "#how", label: "How it works" }}
      />

      <section className="mx-auto max-w-[1240px] px-6 pt-24 pb-10" aria-labelledby="why">
        <div className="mb-14 flex flex-col items-center gap-3 text-center">
          <p className="text-[length:var(--fs-eyebrow)] font-semibold tracking-[var(--tracking-wide)] text-[var(--copper,#8c4435)] uppercase">Why subscribe</p>
          <h2 id="why" className="m-0 font-[family-name:var(--font-display)] text-[length:var(--fs-h2)] leading-[1.1] font-medium">Wear something new, not the same</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            ["New month, new you", "Test-drive a different scent every month and find the ones that truly fit you before buying a full bottle."],
            ["Light on the pocket", active ? `${price} a month brings a 10 ml refillable perfume atomizer to your door.` : "A fixed monthly fee brings a 10 ml refillable perfume atomizer to your door."],
            ["Your nose never gets bored", "We change outfits every day, so why not perfume? Rotating scents keeps you noticing them, instead of growing used to one."],
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

      <section id="how" className="mx-auto max-w-[1240px] px-6 pt-16 pb-24" aria-labelledby="how-h">
        <div className="mb-14 flex flex-col items-center gap-3 text-center">
          <p className="text-[length:var(--fs-eyebrow)] font-semibold tracking-[var(--tracking-wide)] text-[var(--copper,#8c4435)] uppercase">How it works</p>
          <h2 id="how-h" className="m-0 font-[family-name:var(--font-display)] text-[length:var(--fs-h2)] leading-[1.1] font-medium">Three steps to your first atomizer</h2>
        </div>
        <ol className="m-0 grid list-none gap-10 p-0 md:grid-cols-3">
          {[
            ["01", "Choose, or let us choose", "Build a queue of up to 12 fragrances, one for each month. Or leave it to our perfumers to surprise you."],
            ["02", "Activate your subscription", "Add your contact and delivery details. Accurate details help us get your package to you faster."],
            ["03", "Pay, and we take it from there", "Complete payment and our courier will call you when your package is out for delivery."],
          ].map(([number, title, body]) => (
            <li key={number} className="flex flex-col gap-3.5 border-t-2 border-[var(--ink,#241f1b)] pt-6">
              <div className="font-[family-name:var(--font-display)] text-[length:var(--fs-h1)] leading-none text-[var(--copper,#8c4435)]">{number}</div>
              <h3 className="m-0 text-[length:var(--fs-h4)] font-semibold">{title}</h3>
              <p className="m-0 text-[length:var(--fs-body)] leading-[var(--leading-body)] text-[var(--ink-2,#5b5148)]">{body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section id="plans" className="scroll-mt-28 bg-[var(--cream-2,#f3ebda)] px-6 py-24" aria-labelledby="plans-h">
        <div className="mx-auto flex max-w-[1100px] flex-wrap items-stretch gap-12">
          <div className="flex min-w-0 flex-1 basis-[420px] flex-col gap-8">
            <div className="flex flex-col gap-3">
              <p className="text-[length:var(--fs-eyebrow)] font-semibold tracking-[var(--tracking-wide)] text-[var(--copper,#8c4435)] uppercase">Subscribe now</p>
              <h2 id="plans-h" className="m-0 font-[family-name:var(--font-display)] text-[length:var(--fs-h2)] leading-[1.1] font-medium">Set up your Scent Club</h2>
            </div>

            {!zoneCode ? <p className="text-[length:var(--fs-body)]">Select a market to see plans for that zone.</p> : null}
            {plans.isLoading ? <PageLoading label="Loading subscription plans…" /> : null}
            {plans.isError ? (
              <p className="text-[length:var(--fs-body)]" role="alert">Subscription plans could not be loaded. {plans.error.message}</p>
            ) : null}
            {plans.isSuccess && published.length === 0 ? (
              <p className="text-[length:var(--fs-body)]">No subscription plans are published for this market.</p>
            ) : null}

            {lockedPlanCode && plans.isSuccess && !active ? (
              <p className="text-[length:var(--fs-body)]" role="alert">This plan is not available in the current market.</p>
            ) : null}

            {!lockedPlanCode && published.length > 1 ? (
              <fieldset className="m-0 flex flex-col gap-3 border-0 p-0">
                <legend className="mb-3 p-0 text-[length:var(--fs-body)] font-semibold">Which plan?</legend>
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
                        <p className="m-0 text-[length:var(--fs-body)] text-[var(--ink-2,#5b5148)]">{feeText(plan)}</p>
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            ) : null}

            <fieldset className="m-0 flex flex-col gap-3 border-0 p-0">
              <legend className="mb-3 p-0 text-[length:var(--fs-body)] font-semibold">What type of fragrance are you looking for?</legend>
              <div className="grid max-w-[420px] grid-cols-2 gap-1.5 rounded-full border border-[var(--line,#d9ccb4)] bg-white p-1.5">
                {(["men", "women"] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    aria-pressed={gender === option}
                    onClick={() => {
                      setChoicePlan(activePlanCode);
                      setGenderChoice(option);
                    }}
                    className={`min-h-12 rounded-full text-[length:var(--fs-body)] ${gender === option ? "bg-[var(--ink,#241f1b)] font-semibold text-[var(--cream,#faf6ee)]" : "bg-transparent font-medium text-[var(--ink-2,#5b5148)]"}`}
                  >
                    {option === "men" ? "Men" : "Women"}
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
              <legend className="mb-3 p-0 text-[length:var(--fs-body)] font-semibold">How should we pick your fragrances?</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  ["surprise", "Surprise me", "Our perfumers pick a new scent for you each month."],
                  ["choose", "Pick my own 12", "Choose the fragrances you want, month by month."],
                ].map(([value, title, description]) => {
                  const selected = mode === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setModeChoice(value as "choose" | "surprise")}
                      className={`flex min-h-24 flex-col gap-1.5 rounded-2xl px-5 py-4 text-left ${selected ? "border-2 border-[var(--ink,#241f1b)] bg-white" : "border-2 border-[var(--line,#d9ccb4)] bg-[var(--cream,#faf6ee)]"}`}
                    >
                      <span className="text-[length:var(--fs-body-lg)] font-semibold">{title}</span>
                      <span className="text-[0.82rem] leading-normal text-[var(--ink-2,#5b5148)]">{description}</span>
                    </button>
                  );
                })}
              </div>
            </fieldset>
          </div>

          {active ? (
            <div className="flex min-w-0 flex-1 basis-[360px] flex-col gap-5 rounded-3xl bg-[var(--ink,#241f1b)] px-9 py-10 text-[var(--cream,#faf6ee)]">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[length:var(--fs-eyebrow)] font-semibold tracking-[var(--tracking-wide)] text-[var(--gold,#b98a4b)] uppercase">Monthly plan</span>
                <span className="rounded-full border border-white/20 px-3 py-1.5 text-[length:var(--fs-eyebrow)]">{genderLabel}</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-[family-name:var(--font-display)] text-[length:var(--fs-h1)] leading-none">{activePrice?.available ? `${active.currencyCode} ${activePrice.totalAmount}` : "—"}</span>
                <span className="text-[length:var(--fs-body)] text-[var(--sand,#ece0c9)]">/ month</span>
              </div>
              <p className="m-0 text-[length:var(--fs-body)] text-[var(--sand,#ece0c9)]">{active.name}</p>
              <p className="m-0 text-[length:var(--fs-body)] text-[var(--sand,#ece0c9)]">
                {activePrice?.available ? `${activePrice.subscription}. ${activePrice.shipping}.` : activePrice?.message}
              </p>
              <ul className="m-0 flex list-none flex-col gap-3 p-0 text-[length:var(--fs-body)] text-[var(--sand,#ece0c9)]">
                {["One 10 ml refillable atomizer every month", modeLine, "Courier calls before delivery", "Skip, pause or cancel anytime"].map((line) => (
                  <li key={line} className="flex items-start gap-3"><Check />{line}</li>
                ))}
              </ul>
              {lockedPlanCode && !agreementId && bootstrapped && !authed ? (
                <LocaleLink
                  className="mt-2 flex min-h-14 items-center justify-center rounded-full bg-[var(--gold,#b98a4b)] text-[length:var(--fs-body-lg)] font-semibold text-[var(--ink,#241f1b)]"
                  href={`/login?returnTo=${encodeURIComponent(localizeHref(subscriptionCheckoutPath(active.planCode), pathname))}`}
                >
                  Sign in to subscribe
                </LocaleLink>
              ) : null}
              {error ? (
                <p className="m-0 text-[0.85rem] text-[var(--sand,#ece0c9)]" role="alert">{error}</p>
              ) : null}
              {!(lockedPlanCode && bootstrapped && !authed) ? (
                <button
                  type="button"
                  onClick={() => continueWithPlan()}
                  disabled={!activePrice?.available}
                  className="mt-2 flex min-h-14 items-center justify-center rounded-full bg-[var(--gold,#b98a4b)] text-[length:var(--fs-body-lg)] font-semibold text-[var(--ink,#241f1b)] disabled:opacity-50"
                >
                  {agreementId ? "Continue to checkout" : "Subscribe now"}
                </button>
              ) : null}
              <p className="m-0 text-center text-[0.82rem] text-[var(--sand,#ece0c9)]">We ship one fragrance at the start of each month.</p>
            </div>
          ) : null}
        </div>
      </section>

      {active && mode === "choose" && !agreementId ? (
        <section id="shop" className="mx-auto max-w-[1240px] px-6 py-24" aria-labelledby="pick-h">
          <div className="mb-9 flex flex-wrap items-end justify-between gap-6">
            <div className="flex flex-col gap-3">
              <p className="text-[length:var(--fs-eyebrow)] font-semibold tracking-[var(--tracking-wide)] text-[var(--copper,#8c4435)] uppercase">Build your queue</p>
              <h2 id="pick-h" className="m-0 font-[family-name:var(--font-display)] text-[length:var(--fs-h2)] leading-[1.1] font-medium">Choose your favourite 12</h2>
              <p className="m-0 text-[length:var(--fs-body)] text-[var(--ink-2,#5b5148)]">Each pick fills the next month. Any empty months are chosen by our perfumers.</p>
            </div>
            <label className="flex min-h-[52px] min-w-[260px] flex-1 basis-[380px] items-center gap-2.5 rounded-full border border-[var(--line,#d9ccb4)] bg-white px-5">
              <span className="sr-only">Search fragrances</span>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name"
                className="min-w-0 flex-1 border-0 bg-transparent text-[length:var(--fs-body)] text-[var(--ink,#241f1b)] outline-none"
              />
            </label>
          </div>

          <div className="flex flex-wrap items-start gap-8">
            <aside className="flex w-full max-w-[280px] shrink-0 flex-col gap-7">
              <div className="flex items-center gap-4 rounded-[20px] border border-[var(--line,#d9ccb4)] bg-white p-5">
                <svg width="76" height="76" viewBox="0 0 76 76" role="img" aria-label={`${shownQueue.length} of 12 fragrances chosen`}>
                  <circle cx="38" cy="38" r="32" fill="none" stroke="var(--cream-2, #f3ebda)" strokeWidth="6" />
                  <circle cx="38" cy="38" r="32" fill="none" stroke="var(--copper, #8c4435)" strokeWidth="6" strokeLinecap="round" strokeDasharray={dash} transform="rotate(-90 38 38)" />
                  <text x="38" y="44" textAnchor="middle" fontSize="17" fontWeight="700" fill="var(--ink, #241f1b)">{shownQueue.length}/12</text>
                </svg>
                <div className="flex flex-col gap-1">
                  <span className="text-[length:var(--fs-body-lg)] font-semibold">Your queue</span>
                  <span className="text-[0.82rem] text-[var(--ink-2,#5b5148)]">
                    {remaining === 0 ? "All 12 months planned" : `${remaining} ${remaining === 1 ? "month" : "months"} left to fill`}
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-2.5 rounded-[20px] border border-[var(--line,#d9ccb4)] bg-white p-5">
                <span className="mb-1 text-[length:var(--fs-eyebrow)] font-semibold tracking-[0.14em] uppercase">Months in your queue</span>
                <ol className="m-0 flex list-none flex-col gap-1 p-0">
                  {Array.from({ length: QUEUE_LIMIT }, (_, index) => {
                    const id = shownQueue[index];
                    const item = products.data?.find((row) => row.variantId === id);
                    return (
                      <li key={index} className="flex min-h-10 min-w-0 items-center gap-3 overflow-hidden border-b border-[var(--cream-2,#f3ebda)]">
                        <span className="w-9 shrink-0 text-[length:var(--fs-eyebrow)] font-semibold text-[var(--copper,#8c4435)]">M{index + 1}</span>
                        {item ? (
                          <>
                            <span className="size-2.5 shrink-0 rounded-full" style={{ background: tintFor(item.name) }} />
                            <span className="min-w-0 flex-1 truncate text-[0.82rem] font-semibold" title={item.name}>{item.name}</span>
                            <button type="button" aria-label={`Remove ${item.name}`} onClick={() => toggleFragrance(item.variantId)} className="grid h-10 w-8 shrink-0 place-items-center text-[var(--ink-2,#5b5148)]">×</button>
                          </>
                        ) : (
                          <span className="min-w-0 flex-1 truncate text-[0.82rem] text-[var(--ink-2,#5b5148)] italic">Perfumer&apos;s choice</span>
                        )}
                      </li>
                    );
                  })}
                </ol>
                <button type="button" onClick={continueWithPlan} className="mt-3 flex min-h-[52px] items-center justify-center rounded-full bg-[var(--ink,#241f1b)] text-[length:var(--fs-body)] font-semibold text-[var(--cream,#faf6ee)]">
                  Continue with {shownQueue.length} {shownQueue.length === 1 ? "pick" : "picks"}
                </button>
              </div>
            </aside>

            <div className="flex min-w-0 flex-[999] basis-[560px] flex-col gap-5">
              <p className="m-0 text-[length:var(--fs-body)] text-[var(--ink-2,#5b5148)]">
                {products.isSuccess ? `${visible.length} ${visible.length === 1 ? "fragrance" : "fragrances"} on this plan` : "Fragrances for this plan"}
              </p>
              {products.isLoading ? <PageLoading label="Loading fragrances…" /> : null}
              {products.isError ? <p role="alert">These fragrances could not be loaded.</p> : null}
              {products.isSuccess && visible.length === 0 ? (
                <div className="rounded-[20px] border border-dashed border-[var(--line,#d9ccb4)] px-6 py-12 text-center text-[length:var(--fs-body)] text-[var(--ink-2,#5b5148)]">
                  {search.trim() ? "No fragrances match that search." : "No fragrances are available for this audience."}
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
                          className={`mt-auto flex min-h-[46px] items-center justify-center rounded-full border border-[var(--ink,#241f1b)] text-[length:var(--fs-eyebrow)] font-semibold tracking-[0.06em] uppercase ${queued ? "bg-[var(--ink,#241f1b)] text-[var(--cream,#faf6ee)]" : "bg-white text-[var(--ink,#241f1b)]"} disabled:opacity-50`}
                        >
                          {queued ? `Month ${position + 1}` : full ? "Queue full" : "Add to queue"}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {active && mode === "surprise" ? (
        <section className="mx-auto flex max-w-[900px] flex-col items-center gap-4 px-6 py-24 text-center">
          <h2 className="m-0 font-[family-name:var(--font-display)] text-[length:var(--fs-h2)] font-medium">Leave it to our perfumers</h2>
          <p className="m-0 max-w-[560px] text-[length:var(--fs-body-lg)] leading-[var(--leading-body)] text-[var(--ink-2,#5b5148)]">
            Each month our perfumers pick a {gender === "men" ? "men's or unisex" : "women's or unisex"} fragrance for you. Prefer to choose yourself? Switch to “Pick my own 12” above at any time.
          </p>
        </section>
      ) : null}
    </div>
  );
}
