"use client";

import type { MessageKey } from "@/lib/i18n/messages";
import { useShopCopy } from "@/lib/i18n/useShopCopy";
import { COMMUNICATION_PREFERENCES_ID, useCommunicationPreferences } from "../hooks/useCommunicationPreferences";
import type { MarketingChannel } from "../types/customerAccount";

/** Label per channel; the list itself comes from the backend (channels in use). */
export const MARKETING_CHANNEL_LABEL: Record<MarketingChannel, MessageKey> = {
  EMAIL: "account.consent.email",
  SMS: "account.consent.sms",
  WHATSAPP: "account.consent.whatsapp",
  PUSH: "account.consent.push",
};

/**
 * Swiss Arabian's communication preferences: one switch per channel we send
 * offers on. Each switch saves at once and shows what will really happen
 * (shared useCommunicationPreferences).
 */
export function AccountConsentsSection() {
  const t = useShopCopy();
  const prefs = useCommunicationPreferences();

  return (
    <div id={COMMUNICATION_PREFERENCES_ID}>
      <p className="max-w-[660px] text-[12px] text-sa-secondary">{t("account.consent.intro")}</p>

      {prefs.loading ? (
        <p className="mt-4 text-[12px] text-sa-secondary">{t("account.consent.loading")}</p>
      ) : prefs.failed ? (
        <p className="mt-4 text-[12px] text-red-600" role="alert">
          {t("account.consent.loadFailed")}{" "}
          <button type="button" className="cursor-pointer underline" onClick={prefs.retry}>
            {t("account.consent.retry")}
          </button>
        </p>
      ) : (
        <ul className="mt-4 flex flex-col gap-3">
          {prefs.channels.map(({ channel, subscribed }) => {
            const saving = prefs.savingChannel === channel;
            return (
              <li key={channel}>
                <label className="flex cursor-pointer items-center justify-between gap-4 text-[13px] text-sa-primary">
                  <span>{t(MARKETING_CHANNEL_LABEL[channel])}</span>
                  <input
                    type="checkbox"
                    role="switch"
                    aria-checked={subscribed}
                    checked={subscribed}
                    disabled={saving}
                    onChange={(event) => prefs.setSubscribed(channel, event.target.checked)}
                    className="peer sr-only"
                  />
                  <span
                    aria-hidden="true"
                    className={`relative inline-flex h-6 w-11 flex-none items-center rounded-full transition-colors peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-sa-primary ${
                      subscribed ? "bg-sa-primary" : "bg-sa-border"
                    } ${saving ? "opacity-60" : ""}`}
                  >
                    <span
                      className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                        subscribed ? "translate-x-[22px] rtl:-translate-x-[22px]" : "translate-x-0.5 rtl:-translate-x-0.5"
                      }`}
                    />
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
