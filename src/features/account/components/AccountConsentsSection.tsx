"use client";

import { useState } from "react";
import { getUserFacingErrorMessage } from "@/lib/api/userFacingErrors";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import type { MessageKey } from "@/lib/i18n/messages";
import { useShopCopy } from "@/lib/i18n/useShopCopy";

import { accountBtnPrimary } from "../constants/accountForm";
import { useMarketingConsents } from "../hooks/useMarketingConsents";
import type {
  ConsentChannel,
  ConsentStatus,
} from "../types/customerAccount";

const CHANNELS: Array<{ channel: ConsentChannel; label: MessageKey }> = [
  { channel: "EMAIL", label: "account.consent.email" },
  { channel: "SMS", label: "account.consent.sms" },
  { channel: "WHATSAPP", label: "account.consent.whatsapp" },
  { channel: "PUSH", label: "account.consent.push" },
];

function asStatus(value: string | undefined): ConsentStatus {
  if (value === "OPTED_IN" || value === "OPTED_OUT" || value === "UNKNOWN") {
    return value;
  }
  return "UNKNOWN";
}

export function AccountConsentsSection() {
  const t = useShopCopy();
  const user = useCurrentUser();
  const { list, update } = useMarketingConsents();
  const [overrides, setOverrides] = useState<
    Partial<Record<ConsentChannel, boolean>>
  >({});

  function isOptedIn(channel: ConsentChannel): boolean {
    if (channel in overrides) return Boolean(overrides[channel]);
    const saved = list.data?.find((row) => row.channel === channel);
    return asStatus(saved?.status) === "OPTED_IN";
  }

  const dirty = CHANNELS.some(({ channel }) => channel in overrides);

  return (
    <div>
      <p className="max-w-[660px] text-[12px] text-sa-secondary">
        {t("account.consent.intro")}
      </p>

      {list.isPending ? (
        <p className="mt-4 text-[12px] text-sa-secondary">{t("account.consent.loading")}</p>
      ) : list.isError ? (
        <p className="mt-4 text-[12px] text-red-600">
          {getUserFacingErrorMessage(list.error)}
        </p>
      ) : (
        <>
          <ul className="mt-4 flex flex-col gap-3">
            {CHANNELS.map(({ channel, label }) => (
              <li key={channel}>
                <label className="flex items-center gap-2 text-[13px] text-sa-primary">
                  <input
                    type="checkbox"
                    checked={isOptedIn(channel)}
                    onChange={(e) =>
                      setOverrides((prev) => ({
                        ...prev,
                        [channel]: e.target.checked,
                      }))
                    }
                  />
                  {t(label)}
                </label>
              </li>
            ))}
          </ul>
          {!user?.zoneId ? (
            <p className="mt-3 text-[12px] text-sa-secondary">
              {t("account.consent.noZone")}
            </p>
          ) : null}
          <button
            type="button"
            className={`${accountBtnPrimary} mt-5`}
            disabled={update.isPending || !dirty}
            onClick={() => {
              void update
                .unwrap({
                  consents: CHANNELS.map(({ channel }) => ({
                    channel,
                    status: isOptedIn(channel) ? "OPTED_IN" : "OPTED_OUT",
                    zoneId: user?.zoneId,
                  })),
                })
                .then(() => setOverrides({}));
            }}
          >
            {update.isPending ? t("account.saving") : t("account.consent.save")}
          </button>
        </>
      )}
    </div>
  );
}
