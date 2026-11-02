"use client";

import { useState, useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

import { PageLoading } from "@/components/ui/PageLoading";
import { ApiClientError } from "@/lib/api/apiError";
import { useApiQuery } from "@/lib/api/queryHooks";
import { LocaleLink } from "@/lib/i18n/LocaleLink";
import { localizeHref } from "@/lib/i18n/localePath";
import { useAuthStore } from "@/stores/useAuthStore";
import { useUiStore } from "@/stores/useUiStore";
import { listCustomerAddresses } from "@/features/account/api/customerAccount.service";
import { customerAccountKeys } from "@/features/account/api/customerAccount.keys";
import { accountPanel, accountPanelBody, accountPrimaryCta } from "@/styles/accountChrome";
import { SubscriptionCardSetup } from "./SubscriptionCardSetup";

import {
  getSubscriptionConsent,
  getSubscriptionPlan,
  listPlanProducts,
  registerSubscription,
} from "../api/subscription.api";
import { subscriptionKeys } from "../api/subscription.keys";
import type { SubscriptionAudience, SubscriptionDetail, SubscriptionSelectionMode } from "../types/subscription.types";
import {
  CONSENT_REFRESH_CODES,
  QUEUE_CLIENT_LIMIT,
  SCHEDULE_UNAVAILABLE_MESSAGE,
  activeRegistrationConsent,
  audienceChangeNotice,
  buildRegisterBody,
  isSubscriptionAudience,
  modeLabel,
  moveVariant,
  subscriptionPriceLines,
  registrationFingerprint,
  registrationIdempotencyKey,
  registrationSuccessCopy,
  replaceRegistrationIdempotencyKey,
  retainAudienceSelections,
  searchPlanProducts,
  selectVariant,
} from "../utils/subscriptionRules";

type Props = { planCode: string };

function PlanPriceCopy({
  source,
}: {
  source: {
    amount?: string | null;
    currencyCode?: string | null;
    shippingMode?: string | null;
    shippingAmount?: string | null;
    monthlyTotal?: string | null;
  };
}) {
  const price = subscriptionPriceLines(source);
  if (!price.available) {
    return <p className="mt-3" role="status">{price.message}</p>;
  }
  return (
    <div className="mt-3 font-semibold">
      <p>{price.subscription}</p>
      <p>{price.shipping}</p>
      <p>{price.total}</p>
    </div>
  );
}

function draftKey(planCode: string) {
  return `sa-sub-draft:${planCode}`;
}

const draftListeners = new Set<() => void>();

function readDraft(planCode: string): {
  mode: SubscriptionSelectionMode;
  selected: string[];
  audience: SubscriptionAudience | null;
} {
  const empty = { mode: "REPLENISHMENT" as const, selected: [] as string[], audience: null };
  if (typeof window === "undefined") return empty;
  try {
    const raw = sessionStorage.getItem(draftKey(planCode));
    if (!raw) return empty;
    const draft = JSON.parse(raw) as {
      mode?: SubscriptionSelectionMode;
      selected?: string[];
      audience?: unknown;
    };
    return {
      mode: draft.mode ?? "REPLENISHMENT",
      selected: Array.isArray(draft.selected) ? draft.selected.slice(0, QUEUE_CLIENT_LIMIT) : [],
      audience: isSubscriptionAudience(draft.audience) ? draft.audience : null,
    };
  } catch {
    return empty;
  }
}

function writeDraft(
  planCode: string,
  mode: SubscriptionSelectionMode,
  selected: string[],
  audience: SubscriptionAudience | null,
) {
  sessionStorage.setItem(
    draftKey(planCode),
    JSON.stringify({
      mode,
      selected: mode === "QUEUE" ? selected.slice(0, QUEUE_CLIENT_LIMIT) : selected,
      audience,
    }),
  );
  draftListeners.forEach((listener) => listener());
}

export function PlanSelectionPageView({ planCode }: Props) {
  const router = useRouter();
  const pathname = usePathname() || "/";
  const queryClient = useQueryClient();
  const zoneCode = useUiStore((s) => s.catalogContext?.zoneCode || s.selectedMarketId || "");
  const brandCode = useUiStore((s) => s.catalogContext?.brandCode || "");
  const authed = useAuthStore((s) => s.isAuthenticated);
  const bootstrapped = useAuthStore((s) => s.bootstrapped);
  const draftRaw = useSyncExternalStore(
    (listener) => {
      draftListeners.add(listener);
      return () => draftListeners.delete(listener);
    },
    () => sessionStorage.getItem(draftKey(planCode)) ?? "",
    () => "",
  );
  const draft = draftRaw ? readDraft(planCode) : { mode: "REPLENISHMENT" as const, selected: [] as string[], audience: null };
  const mode = draft.mode;
  const selected = draft.selected;
  const audience = draft.audience;
  const [query, setQuery] = useState("");
  const [addressId, setAddressId] = useState("");
  const [acceptedFor, setAcceptedFor] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<SubscriptionDetail | null>(null);

  const plan = useApiQuery(
    subscriptionKeys.plan(planCode, zoneCode),
    () => getSubscriptionPlan(planCode, zoneCode),
    { enabled: Boolean(zoneCode && planCode) },
  );
  const products = useApiQuery(
    subscriptionKeys.products(planCode, zoneCode, audience ?? ""),
    () => listPlanProducts(planCode, zoneCode, audience ?? undefined),
    { enabled: Boolean(zoneCode && planCode && audience) },
  );
  const addresses = useApiQuery(customerAccountKeys.addresses(), listCustomerAddresses, {
    enabled: authed,
  });
  const consent = useApiQuery(
    subscriptionKeys.consent(zoneCode, brandCode),
    () => getSubscriptionConsent(zoneCode),
    { enabled: Boolean(zoneCode) },
  );
  const activeConsent = consent.isSuccess ? activeRegistrationConsent(consent.data) : null;
  const acceptanceKey = `${brandCode}:${zoneCode}:${activeConsent?.version ?? ""}`;
  const accepted = Boolean(activeConsent) && acceptedFor === acceptanceKey;

  const allowed = new Set((products.data ?? []).map((item) => item.variantId));
  const visible = searchPlanProducts(products.data ?? [], query);
  const retained =
    audience && products.isSuccess && products.data
      ? retainAudienceSelections(
          selected,
          products.data.map((item) => item.variantId),
        )
      : { selected, removed: 0 };
  const chosen = retained.selected;
  const audienceNotice = audienceChangeNotice(retained.removed);
  const names = chosen
    .map((id) => products.data?.find((item) => item.variantId === id)?.name ?? id)
    .filter(Boolean);

  function onPick(variantId: string) {
    setError(null);
    if (!audience) {
      setError("Choose Men or Women.");
      return;
    }
    try {
      writeDraft(planCode, mode, selectVariant(mode, chosen, variantId, allowed), audience);
    } catch (err) {
      setError(err instanceof Error ? err.message : "That fragrance cannot be selected.");
    }
  }

  async function onSubmit() {
    if (!plan.data || !activeConsent || consent.isError || !audience) return;
    setSubmitting(true);
    setError(null);
    try {
      const body = buildRegisterBody({
        zoneCode,
        planCode,
        mode,
        audience,
        variantIds: mode === "SURPRISE" ? [] : chosen,
        customerAddressId: addressId,
        consentTextVersion: activeConsent.version,
        allowedVariantIds: [...allowed],
      });
      const fingerprint = registrationFingerprint(body);
      const key = registrationIdempotencyKey(fingerprint, sessionStorage);
      const created = await registerSubscription(body, key);
      replaceRegistrationIdempotencyKey(fingerprint, sessionStorage);
      setSaved(created);
    } catch (err) {
      if (err instanceof ApiClientError && err.code && CONSENT_REFRESH_CODES.has(err.code)) {
        setAcceptedFor(null);
        setError(
          err.code === "SUB_CONSENT_UNAVAILABLE"
            ? "Registration is unavailable because this market has no active agreement."
            : "This agreement was replaced. Review the current wording and accept it again.",
        );
        await queryClient.invalidateQueries({
          queryKey: subscriptionKeys.consent(zoneCode, brandCode),
        });
      } else if (err instanceof ApiClientError && err.code === "SUB_SCHEDULE_UNAVAILABLE") {
        setError(err.message && err.message !== "The request could not be completed." ? err.message : SCHEDULE_UNAVAILABLE_MESSAGE);
      } else if (err instanceof ApiClientError && err.code === "SUB_IDEMPOTENCY_PAYLOAD_MISMATCH") {
        setError(
          "This registration was already sent with different details. Start a new registration to save another subscription.",
        );
      } else {
        setError(err instanceof Error ? err.message : "Registration could not be saved.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (!zoneCode) {
    return <p className="px-4 py-10">Select a market before choosing a subscription plan.</p>;
  }
  if (plan.isLoading || products.isLoading) return <PageLoading label="Loading this plan…" />;
  if (plan.isError) {
    return (
      <p className="px-4 py-10" role="alert">
        This plan is not available in the current market. {plan.error.message}
      </p>
    );
  }

  if (saved && plan.data) {
    const lines = registrationSuccessCopy({
      planName: plan.data.name,
      amount: saved.amount,
      currencyCode: saved.currencyCode,
      shippingMode: saved.shippingMode,
      shippingAmount: saved.shippingAmount,
      monthlyTotal: saved.monthlyTotal,
      mode: saved.selectionMode,
      fragranceNames: names,
    });
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className={accountPanel}>
          <div className={accountPanelBody}>
            {lines.map((line) => (
              <p key={line} className="mt-2 first:mt-0">
                {line}
              </p>
            ))}
            <LocaleLink className={`${accountPrimaryCta} mt-6`} href={`/account/subscription/${saved.id}`}>
              View this agreement
            </LocaleLink>
            {activeConsent ? (
              <SubscriptionCardSetup
                zoneCode={zoneCode}
                consentVersion={activeConsent.version}
                consentText={activeConsent.text}
                returnPath={localizeHref(`/account/subscription/${saved.id}`, pathname)}
              />
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[var(--chrome-content-max)] px-[var(--chrome-edge)] py-10 [@media(min-width:1200px)]:px-0">
      <LocaleLink href="/subscriptions" className="text-[0.85rem] text-[var(--copper,#8c4435)]">
        All plans
      </LocaleLink>
      <h1 className="mt-3 text-[1.6rem] font-semibold break-words">{plan.data?.name}</h1>
      {plan.data?.description ? <p className="mt-2 max-w-2xl break-words">{plan.data.description}</p> : null}
      {plan.data ? (
        <PlanPriceCopy source={plan.data} />
      ) : null}
      <p className="mt-2 max-w-2xl text-[0.9rem] text-[var(--ink-2,#5b5148)]">
        Fragrances below are the ones this plan currently allows. Product retail prices are not the subscription fee.
        Replenishment keeps one fragrance. Queue keeps an ordered list. Surprise Me does not allocate a fragrance now.
      </p>

      <fieldset className="mt-6 flex flex-wrap gap-2 border-0 p-0">
        <legend className="mb-2 w-full text-[0.85rem] font-semibold">Audience</legend>
        {(["MEN", "WOMEN"] as const).map((value) => (
          <button
            key={value}
            type="button"
            className={`h-11 rounded-full px-4 text-[0.85rem] ${audience === value ? "bg-[var(--copper,#8c4435)] text-white" : "border border-[var(--line)] bg-white"}`}
            aria-pressed={audience === value}
            onClick={() => writeDraft(planCode, mode, chosen, value)}
          >
            {value === "MEN" ? "Men" : "Women"}
          </button>
        ))}
      </fieldset>

      <fieldset className="mt-6 flex flex-wrap gap-2 border-0 p-0">
        <legend className="mb-2 w-full text-[0.85rem] font-semibold">Selection</legend>
        {(["REPLENISHMENT", "QUEUE", "SURPRISE"] as const).map((value) => (
          <button
            key={value}
            type="button"
            className={`h-11 rounded-full px-4 text-[0.85rem] ${mode === value ? "bg-[var(--copper,#8c4435)] text-white" : "border border-[var(--line)] bg-white"}`}
            aria-pressed={mode === value}
            onClick={() => {
              const nextSelected =
                value === "SURPRISE"
                  ? []
                  : value === "REPLENISHMENT"
                    ? chosen.slice(0, 1)
                    : chosen.slice(0, QUEUE_CLIENT_LIMIT);
              writeDraft(planCode, value, nextSelected, audience);
            }}
          >
            {modeLabel(value)}
          </button>
        ))}
      </fieldset>

      {mode !== "SURPRISE" ? (
        <label className="mt-4 block text-[0.85rem]">
          Search approved fragrances
          <input
            className="mt-1 h-11 w-full max-w-md rounded border border-[var(--line)] px-3"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
      ) : (
        <p className="mt-4 text-[0.9rem]">
          Surprise Me uses the published schedule for the audience you chose. No fragrance is allocated now.
        </p>
      )}

      {products.isError ? (
        <p className="mt-4" role="alert">
          Approved fragrances could not be loaded. {products.error.message}
        </p>
      ) : null}
      {products.isSuccess && products.data.length === 0 ? (
        <p className="mt-4">This plan has no selectable fragrances right now.</p>
      ) : null}

      {mode !== "SURPRISE" && visible.length > 0 ? (
        <ul className="mt-4 grid list-none grid-cols-1 gap-3 p-0 sm:grid-cols-2">
          {visible.map((item) => {
            const on = chosen.includes(item.variantId);
            return (
              <li key={item.variantId} className={accountPanel}>
                <div className={accountPanelBody}>
                  <p className="m-0 font-semibold break-words">{item.name}</p>
                  <p className="mt-1 text-[0.8rem] break-all text-[var(--ink-2,#5b5148)]">{item.sku}</p>
                  <button type="button" className="mt-3 h-11 underline" onClick={() => onPick(item.variantId)}>
                    {on ? "Selected" : "Select"}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}

      {mode === "QUEUE" && chosen.length > 0 ? (
        <ol className="mt-6 list-decimal ps-5">
          {chosen.map((id, index) => (
            <li key={id} className="mt-2 break-words">
              {products.data?.find((item) => item.variantId === id)?.name ?? id}
              <span className="ms-2 inline-flex gap-2">
                <button type="button" className="h-11 px-2 underline" onClick={() => writeDraft(planCode, mode, moveVariant(chosen, index, -1), audience)}>
                  Up
                </button>
                <button type="button" className="h-11 px-2 underline" onClick={() => writeDraft(planCode, mode, moveVariant(chosen, index, 1), audience)}>
                  Down
                </button>
                <button
                  type="button"
                  className="h-11 px-2 underline"
                  onClick={() => writeDraft(planCode, mode, chosen.filter((value) => value !== id), audience)}
                >
                  Remove
                </button>
              </span>
            </li>
          ))}
        </ol>
      ) : null}

      <p className="mt-4 text-[0.85rem]">Selected: {mode === "SURPRISE" ? "Surprise Me" : chosen.length}</p>

      {bootstrapped && !authed ? (
        <LocaleLink
          className={`${accountPrimaryCta} mt-6`}
          href={`/login?returnTo=${encodeURIComponent(`/subscriptions/${planCode}`)}`}
        >
          Sign in to register
        </LocaleLink>
      ) : null}

      {authed ? (
        <form
          className="mt-6 max-w-xl"
          onSubmit={(event) => {
            event.preventDefault();
            void onSubmit();
          }}
        >
          <label className="block text-[0.85rem]">
            Delivery address
            <select
              className="mt-1 h-11 w-full rounded border border-[var(--line)] px-3"
              value={addressId}
              onChange={(event) => setAddressId(event.target.value)}
              required
            >
              <option value="">Choose an address</option>
              {(addresses.data ?? []).map((address) => (
                <option key={address.id} value={address.id}>
                  {[address.address1, address.city, address.country].filter(Boolean).join(", ")}
                </option>
              ))}
            </select>
          </label>
          {addresses.isSuccess && addresses.data.length === 0 ? (
            <p className="mt-2 text-[0.85rem]">
              Add an address in your account before registering.{" "}
              <button type="button" className="underline" onClick={() => router.push("/account/addresses")}>
                Manage addresses
              </button>
            </p>
          ) : null}

          {consent.isPending ? (
            <p className="mt-4 text-[0.9rem]" role="status">
              Loading the registration agreement…
            </p>
          ) : null}
          {consent.isError ? (
            <p className="mt-4 text-[0.9rem]" role="alert">
              The registration agreement could not be loaded. Registration stays closed until it can be read.
            </p>
          ) : null}
          {consent.isSuccess && activeConsent ? (
            <label className="mt-4 flex items-start gap-2 text-[0.85rem]">
              <input
                type="checkbox"
                className="mt-1"
                checked={accepted}
                onChange={(event) => setAcceptedFor(event.target.checked ? acceptanceKey : null)}
                required
              />
              <span className="break-words whitespace-pre-line">{activeConsent.text}</span>
            </label>
          ) : null}
          {consent.isSuccess && !activeConsent ? (
            <p className="mt-4 text-[0.9rem]" role="status">
              Registration is unavailable until an approved agreement is published for this market.
              No placeholder terms will be submitted.
            </p>
          ) : null}

          {audienceNotice ? (
            <p className="mt-3" role="status">
              {audienceNotice}
            </p>
          ) : null}
          {error ? (
            <p className="mt-3" role="alert">
              {error}
            </p>
          ) : null}
          {error?.includes("Start a new registration") ? (
            <button
              type="button"
              className="mt-2 underline"
              onClick={() => {
                if (!activeConsent || !audience) return;
                const body = buildRegisterBody({
                  zoneCode,
                  planCode,
                  mode,
                  audience,
                  variantIds: mode === "SURPRISE" ? [] : chosen,
                  customerAddressId: addressId,
                  consentTextVersion: activeConsent.version,
                  allowedVariantIds: [...allowed],
                });
                replaceRegistrationIdempotencyKey(registrationFingerprint(body), sessionStorage);
                setError(null);
              }}
            >
              Start a new registration
            </button>
          ) : null}

          <button
            type="submit"
            className={`${accountPrimaryCta} mt-5`}
            disabled={
              submitting ||
              consent.isPending ||
              consent.isError ||
              !activeConsent ||
              !accepted ||
              !addressId ||
              !audience ||
              !(plan.data && subscriptionPriceLines(plan.data).available)
            }
          >
            {submitting ? "Saving…" : "Save registration"}
          </button>
        </form>
      ) : null}
    </div>
  );
}
