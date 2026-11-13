"use client";

import { useGuestTracking, useTrackLookup } from "@/features/tracking/hooks/useOrderTrackingLookup";
import { Button, Field, Wrap } from "../../ui";
import { buttonClass } from "../../ui/Button";
import { useSapilCopy } from "../../i18n/SapilCopy";
import { SapilLink, richText, useSapilDate, useSapilMoney } from "../../components/commerce/shared";
import { StatusPill, statusText } from "../../components/account/AccountChrome";
import { FormCard, FormMessage } from "../../components/account/FormCard";
import { OrderStateCard, SapilOrderView } from "../../components/orders/SapilOrderView";
import { orderSteps } from "../../components/orders/orderParts";
import { trackingUnitCount } from "@/features/orders/utils/orderStatus";
import { TrackingDetails, stoppedText, trackingStep, useDeliveryHighlight } from "../../components/orders/TrackingDetails";

/** `/track`: find an order by number + tracking token (design-system form card). */
export function SapilTrackLookupPage() {
  const t = useSapilCopy();
  const { isAuthenticated, orderNumber, setOrderNumber, token, setToken, error, submit } = useTrackLookup();
  return (
    <Wrap>
      <FormCard
        eyebrow={t("account.trackEyebrow")}
        title={t("account.trackTitle")}
        accent={t("account.trackAccent")}
        lede={t("account.trackLede")}
        footer={
          isAuthenticated
            ? richText(t("account.trackSignedIn"), {
                link: (
                  <SapilLink href="/account/orders" className="underline">
                    {t("account.ordersTitle")}
                  </SapilLink>
                ),
              })
            : richText(t("account.trackSignIn"), {
                link: (
                  <SapilLink href="/login?returnTo=%2Faccount%2Forders" className="underline">
                    {t("account.trackSignInLink")}
                  </SapilLink>
                ),
              })
        }
      >
        <form onSubmit={submit} noValidate className="flex flex-col gap-[14px]">
          <Field
            id="track-number"
            name="orderNumber"
            label={t("account.trackNumber")}
            placeholder={t("account.trackNumberPlaceholder")}
            autoComplete="off"
            spellCheck={false}
            dir="ltr"
            value={orderNumber}
            onChange={(event) => setOrderNumber(event.target.value)}
            error={error === "orderNumber" ? t("account.trackErrNumber") : undefined}
          />
          <Field
            id="track-token"
            name="token"
            label={t("account.trackToken")}
            optional={isAuthenticated ? t("account.trackTokenHint") : undefined}
            placeholder={t("account.trackTokenPlaceholder")}
            autoComplete="off"
            spellCheck={false}
            dir="ltr"
            value={token}
            onChange={(event) => setToken(event.target.value)}
            error={error === "token" ? t("account.trackErrToken") : undefined}
          />
          <Button type="submit" className="w-full mt-[6px]">
            {t("account.trackSubmit")}
          </Button>
        </form>
      </FormCard>
    </Wrap>
  );
}

/** `/track/[orderNumber]`: the order's tracker and shipments, or the token form for a guest. */
export function SapilGuestTrackingPage({ orderNumber }: { orderNumber: string }) {
  const t = useSapilCopy();
  const money = useSapilMoney();
  const date = useSapilDate();
  const tracking = useGuestTracking(orderNumber);
  const deliveryHighlight = useDeliveryHighlight();
  const { summary } = tracking;

  if (tracking.loading) return <OrderStateCard busy title={t("account.trackLookup")} />;

  if (summary) {
    const step = trackingStep(summary);
    const status = statusText(t, summary.status);
    return (
      <SapilOrderView
        crumbs={[{ label: t("account.home"), href: "/" }, { label: t("account.trackEyebrow"), href: "/track" }, { label: summary.orderNumber }]}
        tone={summary.status === "CANCELLED" || summary.status === "FAILED" ? "failed" : step >= 4 ? "ok" : "info"}
        eyebrow={t("account.trackEyebrow")}
        headline={<span dir="ltr">{summary.orderNumber}</span>}
        intro={
          <>
            {t("account.trackPlaced", {
              date: date(summary.createdAt),
              items: t("account.ordersItems", { count: trackingUnitCount(summary) }),
              total: money(Number(summary.total), summary.currency),
            })}
            <span className="block mt-[10px]">
              <StatusPill status={summary.status} label={status} />
            </span>
          </>
        }
        highlight={deliveryHighlight(summary) ?? undefined}
        steps={step >= 0 ? orderSteps(t, step) : undefined}
        stopped={step < 0 ? stoppedText(t, summary.status) : undefined}
        notices={<TrackingDetails summary={summary} timeline={tracking.timeline} />}
        actions={
          <>
            {tracking.ownOrder ? (
              <Button href={`/account/orders/${encodeURIComponent(summary.orderId)}`} LinkComponent={SapilLink}>
                {t("account.trackFullOrder")}
              </Button>
            ) : (
              <Button href="/products" LinkComponent={SapilLink}>
                {t("account.odContinue")}
              </Button>
            )}
            <SapilLink href="/" className={buttonClass("link")}>
              {t("account.odBackHome")}
            </SapilLink>
          </>
        }
      />
    );
  }

  const error =
    tracking.formError === "empty"
      ? t("account.trackErrToken")
      : tracking.formError === "isOrderNumber"
        ? t("account.trackErrIsNumber")
        : tracking.tokenRejected
          ? t("account.trackErrRejected")
          : null;

  return (
    <Wrap>
      <FormCard
        eyebrow={t("account.trackEyebrow")}
        title={t("account.trackTitle")}
        accent={t("account.trackAccent")}
        lede={richText(t("account.trackTokenFor"), { number: <b dir="ltr">{orderNumber}</b> })}
        footer={
          tracking.isAuthenticated
            ? richText(t("account.trackSignedIn"), {
                link: (
                  <SapilLink href="/account/orders" className="underline">
                    {t("account.ordersTitle")}
                  </SapilLink>
                ),
              })
            : richText(t("account.trackSignIn"), {
                link: (
                  <SapilLink href={`/login?returnTo=${encodeURIComponent(tracking.pathname)}`} className="underline">
                    {t("account.trackSignInLink")}
                  </SapilLink>
                ),
              })
        }
      >
        {tracking.notInAccount && !tracking.token ? <FormMessage tone="ok">{t("account.trackNotInAccount")}</FormMessage> : null}
        <form onSubmit={tracking.lookup} noValidate className="flex flex-col gap-[14px]">
          <Field
            id="track-token"
            name="token"
            label={t("account.trackToken")}
            placeholder={t("account.trackTokenPlaceholder")}
            autoComplete="off"
            spellCheck={false}
            dir="ltr"
            value={tracking.tokenInput}
            onChange={(event) => tracking.setTokenInput(event.target.value)}
            error={error ?? undefined}
          />
          <Button type="submit" className="w-full mt-[6px]">
            {t("account.trackSubmit")}
          </Button>
        </form>
      </FormCard>
    </Wrap>
  );
}
