"use client";

import { PREFERENCES_PATH, useEmailLinkRedirect, useUnsubscribe } from "@/features/journeys/hooks/useEmailLinks";
import { useShopCopy } from "@/lib/i18n/useShopCopy";
import { Button, cx } from "../../ui";
import { buttonClass } from "../../ui/Button";
import { SapilLink } from "../../components/shared/SapilLink";
import { OrderStateCard } from "../../components/orders/SapilOrderView";

/** `/unsubscribe` from a marketing email: confirm with one click (shared useUnsubscribe). */
export function SapilUnsubscribePage() {
  const copy = useShopCopy();
  const { status, confirm } = useUnsubscribe();
  const body =
    status === "done" ? (
      <span role="status">{copy("unsubscribeDone")}</span>
    ) : status === "failed" ? (
      <span role="alert">{copy("unsubscribeFailed")}</span>
    ) : (
      copy("unsubscribeBody")
    );
  return (
    <OrderStateCard
      title={copy("unsubscribeTitle")}
      body={body}
      actions={
        <>
          {status === "idle" || status === "working" ? (
            <Button onClick={() => void confirm()} disabled={status === "working"} className={cx(status === "working" && "opacity-60 cursor-wait")}>
              {copy("unsubscribeAction")}
            </Button>
          ) : null}
          {/* Done or a dead link: the account is where offers are chosen, channel by channel. */}
          {status === "done" || status === "failed" ? (
            <Button href={PREFERENCES_PATH} variant={status === "failed" ? "dark" : "line"} LinkComponent={SapilLink}>
              {copy("unsubscribeManage")}
            </Button>
          ) : null}
          <SapilLink href="/" className={buttonClass("link")}>
            {copy("unsubscribeBack")}
          </SapilLink>
        </>
      }
    />
  );
}

/** `/r` from a journey email's button: "taking you there", or why not (shared useEmailLinkRedirect). */
export function SapilEmailLinkPage() {
  const copy = useShopCopy();
  const { failed } = useEmailLinkRedirect();
  return failed ? (
    <OrderStateCard
      title={<span role="alert">{copy("emailLinkFailed")}</span>}
      actions={
        <Button href="/" LinkComponent={SapilLink}>
          {copy("emailLinkHome")}
        </Button>
      }
    />
  ) : (
    <OrderStateCard busy title={copy("emailLinkOpening")} />
  );
}
