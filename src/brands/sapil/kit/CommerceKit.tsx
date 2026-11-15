"use client";

import { useState, type ReactNode } from "react";
import { SapilBagDrawerView, type SapilBagLineData } from "../components/bag/SapilBagDrawerView";
import {
  CheckoutEmptyCard,
  CheckoutHeader,
  DeliveryMethodFieldset,
  OrderSummary,
  ReviewBlock,
} from "../components/checkout/CheckoutParts";
import { Button } from "../ui";

/*
 * Fixtures for the bag drawer and checkout, with the v9 mock values as v9 renders them
 * (sapil-catalog.js + sapil-live.js: Berry Crush AED 63, was AED 90; free delivery over
 * AED 100; standard delivery AED 16). Used by scripts/sapil-visual-diff.mjs only — the real
 * pages read every number from the API.
 */
const BERRY_IMG =
  "https://sapil.com/cdn/shop/files/Straight-angle_cdd31f2a-19e7-4d6a-9be2-a0f992d7eb74.webp?v=1784100747&width=200";

const LINE: SapilBagLineData = {
  key: "berry-crush",
  name: "Berry Crush",
  href: "#berry-crush",
  imageSrc: BERRY_IMG,
  detail: "Juicy Pleasures · AED 63",
  tile: "sky",
  quantity: 1,
  total: "AED 63",
  was: "AED 90",
};

/** v9 arrival date: working days ahead, skipping Saturday and Sunday. */
function arrivesBy(days: number): string {
  const d = new Date();
  let n = days;
  while (n > 0) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() % 6) n--;
  }
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

function Kit({ id, only, children, wrap }: { id: string; only?: string; children: ReactNode; wrap?: boolean }) {
  if (only && only !== id) return null;
  // Fixed overlays (the drawer) are measured on their own element: the diff script tags it.
  return wrap ? <div data-kit-wrap={id}>{children}</div> : <section data-kit={id}>{children}</section>;
}

export function CommerceKit({ only }: { only?: string }) {
  const [qty, setQty] = useState(1);
  const [method, setMethod] = useState("standard");
  const [promo, setPromo] = useState("");
  const noop = () => undefined;
  return (
    <div className="bg-sapil-paper min-h-screen pb-[80px]">
      <Kit id="drawer" only={only} wrap>
        <SapilBagDrawerView
          open
          onClose={noop}
          count={qty}
          freeDelivery={{ state: "progress", remaining: "AED 37", threshold: "AED 100", percent: 63 }}
          lines={[{ ...LINE, quantity: qty }]}
          onQuantityChange={(_, next) => setQty(next)}
          onRemove={noop}
          subtotal="AED 63"
          delivery="AED 16"
          total="AED 79"
          checkoutHref="#checkout"
          shopHref="#shop"
        />
      </Kit>

      <Kit id="drawer-empty" only={only} wrap>
        <SapilBagDrawerView
          open
          onClose={noop}
          count={0}
          freeDelivery={{ state: "start", threshold: "AED 100" }}
          lines={[]}
          onQuantityChange={noop}
          onRemove={noop}
          subtotal=""
          delivery=""
          total=""
          checkoutHref="#checkout"
          shopHref="#shop"
        />
      </Kit>

      <Kit id="co-head" only={only}>
        <CheckoutHeader step="delivery" bagHint="1 item · AED 63" onOpenBag={noop} />
      </Kit>

      <Kit id="co-method" only={only}>
        <DeliveryMethodFieldset
          value={method}
          onChange={setMethod}
          options={[
            {
              value: "standard",
              title: "Standard delivery",
              description: `2 working days · arrives by ${arrivesBy(2)}`,
              fee: "AED 16",
            },
            {
              value: "express",
              title: "Express delivery",
              description: `Next working day in Dubai, Sharjah and Abu Dhabi · arrives by ${arrivesBy(1)}`,
              fee: "AED 25",
            },
          ]}
        />
      </Kit>

      <Kit id="co-summary" only={only}>
        <OrderSummary
          open
          lines={[
            {
              key: "berry-crush",
              name: "Berry Crush",
              href: "#berry-crush",
              imageSrc: BERRY_IMG.replace("width=200", "width=160"),
              tile: "sky",
              quantity: qty,
              meta: "Juicy Pleasures · 100ml",
              price: "AED 63",
            },
          ]}
          onQuantity={(_, next) => setQty(Math.max(1, next))}
          promo={{
            value: promo,
            onChange: setPromo,
            onSubmit: (event) => event.preventDefault(),
            submitLabel: "Apply",
            message: {
              tone: "info",
              content: (
                <>
                  First order? Try <b>SAPIL10</b> for 10% off.
                </>
              ),
            },
          }}
          rows={[
            { key: "sub", label: "Subtotal", value: "AED 63" },
            { key: "ship", label: "Standard delivery", value: "AED 16" },
          ]}
          grand={{ label: "Total", currency: "AED", amount: "79" }}
          vatNote="Includes AED 3.76 VAT"
          trust={["Free delivery over AED 100", "Easy 7-day returns", "Order updates on WhatsApp"]}
        />
      </Kit>

      <Kit id="co-review" only={only}>
        <ReviewBlock
          rows={[
            { label: "Contact", value: "mariam@example.com · +971 50 123 4567", onChange: noop },
            {
              label: "Deliver to",
              value: "Mariam Al Falasi, Apt 1204, Bay Square Building 7, Business Bay, Dubai",
              onChange: noop,
            },
            { label: "Method", value: `Standard delivery · arrives by ${arrivesBy(2)}`, onChange: noop },
          ]}
        />
      </Kit>

      <Kit id="co-empty" only={only}>
        <CheckoutEmptyCard
          title="Your bag is empty."
          body="Add a bottle or two, then come back here to check out."
          actions={<Button href="#shop">Shop all fragrances</Button>}
        />
      </Kit>
    </div>
  );
}
