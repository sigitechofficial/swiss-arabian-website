"use client";

import { useState } from "react";
import { getUserFacingErrorMessage } from "@/lib/api/userFacingErrors";
import { useCurrentUser } from "@/hooks/useCurrentUser";

import { accountBtnPrimary } from "../constants/accountForm";
import { useMarketingConsents } from "../hooks/useMarketingConsents";
import type {
  ConsentChannel,
  ConsentStatus,
} from "../types/customerAccount";

const CHANNELS: Array<{ channel: ConsentChannel; label: string }> = [
  { channel: "EMAIL", label: "Email offers" },
  { channel: "SMS", label: "SMS / text" },
  { channel: "WHATSAPP", label: "WhatsApp" },
  { channel: "PUSH", label: "Push notifications" },
];

function asStatus(value: string | undefined): ConsentStatus {
  if (value === "OPTED_IN" || value === "OPTED_OUT" || value === "UNKNOWN") {
    return value;
  }
  return "UNKNOWN";
}

export function AccountConsentsSection() {
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
      <p className="max-w-[660px] text-[13px] text-sa-secondary">
        Choose how Swiss Arabian can contact you about offers. Order updates
        still go through transactional channels.
      </p>

      {list.isPending ? (
        <p className="mt-4 text-[13px] text-sa-secondary">Loading preferences…</p>
      ) : list.isError ? (
        <p className="mt-4 text-[13px] text-red-600">
          {getUserFacingErrorMessage(list.error)}
        </p>
      ) : (
        <>
          <ul className="mt-4 flex flex-col gap-3">
            {CHANNELS.map(({ channel, label }) => (
              <li key={channel}>
                <label className="flex items-center gap-2 text-[14px] text-sa-primary">
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
                  {label}
                </label>
              </li>
            ))}
          </ul>
          {!user?.zoneId ? (
            <p className="mt-3 text-[12px] text-sa-secondary">
              Consents save against your market zone. If nothing changes after
              save, your account may be missing a zone.
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
            {update.isPending ? "Saving…" : "Save preferences"}
          </button>
        </>
      )}
    </div>
  );
}
