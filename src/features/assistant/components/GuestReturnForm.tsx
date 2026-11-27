"use client";

import { useState, type FormEvent } from "react";
import { useShopCopy } from "@/lib/i18n/useShopCopy";

export type GuestReturnValues = { kind: "RETURN" | "EXCHANGE"; orderNumber: string; code: string };

/**
 * A guest proves the order they placed without an account: its number and the code from the confirmation
 * email. The code is kept only in this window's memory and goes out with each request; the server checks
 * it every time and never stores it.
 */
export function GuestReturnForm({
  busy,
  onStart,
  onCancel,
}: {
  busy: boolean;
  onStart: (values: GuestReturnValues) => void;
  onCancel: () => void;
}) {
  const copy = useShopCopy();
  const [kind, setKind] = useState<"RETURN" | "EXCHANGE">("RETURN");
  const [orderNumber, setOrderNumber] = useState("");
  const [code, setCode] = useState("");
  const field = "w-full rounded-lg border border-black/20 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-black/50";
  const ready = orderNumber.trim().length > 0 && code.trim().length > 0;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!ready || busy) return;
    onStart({ kind, orderNumber: orderNumber.trim(), code: code.trim() });
  };

  return (
    <form onSubmit={submit} data-assistant-guest-return className="space-y-2 rounded-xl border border-black/10 bg-white p-3 text-xs">
      <p className="m-0 font-medium">{copy("assistant.guestReturn.title")}</p>
      <p className="m-0 opacity-80">{copy("assistant.guestReturn.intro")}</p>
      <div className="flex gap-2" role="radiogroup" aria-label={copy("assistant.guestReturn.kind")}>
        {(["RETURN", "EXCHANGE"] as const).map((value) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={kind === value}
            onClick={() => setKind(value)}
            className={`cursor-pointer rounded-full border px-3 py-1.5 ${kind === value ? "border-black/60 bg-black/[0.06] font-medium" : "border-black/20 bg-white"}`}
          >
            {copy(value === "RETURN" ? "assistant.guestReturn.return" : "assistant.guestReturn.exchange")}
          </button>
        ))}
      </div>
      <input
        aria-label={copy("assistant.guestReturn.orderNumber")}
        placeholder={copy("assistant.guestReturn.orderNumber")}
        value={orderNumber}
        onChange={(event) => setOrderNumber(event.target.value)}
        maxLength={64}
        autoComplete="off"
        dir="ltr"
        className={field}
      />
      <input
        aria-label={copy("assistant.guestReturn.code")}
        placeholder={copy("assistant.guestReturn.code")}
        value={code}
        onChange={(event) => setCode(event.target.value)}
        maxLength={512}
        autoComplete="off"
        dir="ltr"
        className={field}
      />
      <div className="flex gap-2">
        <button type="submit" disabled={!ready || busy} className="cursor-pointer rounded-full bg-black px-3 py-1.5 text-white disabled:opacity-40">
          {copy("assistant.guestReturn.start")}
        </button>
        <button type="button" onClick={onCancel} className="cursor-pointer rounded-full border border-black/20 bg-white px-3 py-1.5 hover:bg-black/5">
          {copy("assistant.guestReturn.cancel")}
        </button>
      </div>
    </form>
  );
}
