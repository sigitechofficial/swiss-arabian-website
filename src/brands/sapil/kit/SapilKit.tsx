"use client";

import { useState, type ReactNode } from "react";
import {
  AnnouncementBar,
  Accordion,
  BagLine,
  Breadcrumbs,
  Button,
  CardLogo,
  Checkbox,
  Chip,
  Dialog,
  Drawer,
  Field,
  FieldGrid,
  Fieldset,
  FreeDeliveryCard,
  IconButton,
  Price,
  ProductCard,
  QuantityStepper,
  RadioCardGroup,
  SectionHead,
  SelectField,
  Stars,
  Steps,
  Subnav,
  SummaryRow,
  Tabs,
  TabPanel,
  Toast,
  Wrap,
} from "../ui";
import { ChevronIcon } from "../ui/shared";

/* Mock values copied from the v9 reference (sapil-catalog.js + sapil-live.js, as rendered). */
const BERRY = {
  name: "Berry Crush",
  href: "#berry-crush",
  image:
    "https://sapil.com/cdn/shop/files/Straight-angle_cdd31f2a-19e7-4d6a-9be2-a0f992d7eb74.webp?v=1784100747&width=700",
  thumb:
    "https://sapil.com/cdn/shop/files/Straight-angle_cdd31f2a-19e7-4d6a-9be2-a0f992d7eb74.webp?v=1784100747&width=200",
};
const SUBNAV = [
  { label: "For Her", href: "#for-her", color: "peach" },
  { label: "For Him", href: "#for-him", color: "sky" },
  { label: "Unisex", href: "#unisex", color: "lilac" },
  { label: "Mood", href: "#mood", color: "butter" },
  { label: "Note", href: "#notes", color: "mint" },
  { label: "Bundles", href: "#bundles", color: "sage" },
  { label: "Gift sets", href: "#gift-sets", color: "sand" },
  { label: "Under AED 99", href: "#under-99", color: "pink", sale: true },
];

function Kit({ id, only, children, className }: { id: string; only?: string; children: ReactNode; className?: string }) {
  if (only && only !== id) return null;
  return (
    <section data-kit={id} className={className}>
      {children}
    </section>
  );
}

function Label({ children, only }: { children: ReactNode; only?: string }) {
  if (only) return null;
  return (
    <p data-kit-chrome className="mt-[56px] mb-[12px] text-[12px] font-[700] tracking-[.14em] uppercase text-sapil-muted">
      {children}
    </p>
  );
}

export function SapilKit({ only }: { only?: string }) {
  const [added, setAdded] = useState(false);
  const [qty, setQty] = useState(2);
  const [chip, setChip] = useState("all");
  const [tab, setTab] = useState("99");
  const [drawer, setDrawer] = useState(false);
  const [dialog, setDialog] = useState(false);
  const [toast, setToast] = useState(false);

  return (
    <div className={only ? undefined : "pb-[120px]"}>
      <Kit id="announce" only={only}>
        <AnnouncementBar href="#scent-society">
          New: <b>The Scent Society</b> · Four expressions, one signature →
        </AnnouncementBar>
      </Kit>
      <Kit id="subnav" only={only}>
        <Subnav label="Shop by" items={SUBNAV} info="Free delivery over AED 100 · Pay on delivery" />
      </Kit>

      <Wrap className={only ? "!max-w-none !px-0" : undefined}>
        {!only && (
          <h1 data-kit-chrome className="font-sapil-display text-[56px] mt-[40px]">
            Sapil kit <span className="font-sapil-serif italic">v9</span>
          </h1>
        )}

        <Label only={only}>Breadcrumbs</Label>
        <Kit id="crumbs" only={only}>
          <Breadcrumbs items={[{ label: "Home", href: "#home" }, { label: "Blogs" }]} />
        </Kit>

        <Label only={only}>Section head + icon buttons</Label>
        <Kit id="sechead" only={only} className="bg-sapil-white">
          <SectionHead
            eyebrow="New arrivals"
            title="Just landed,"
            accent="still fizzing."
            description="The Scent Society, Solid Legacy and Chichi Fantasy, plus Sarab, Zeyn and Alchemy."
            actions={
              <div className="flex gap-[8px]">
                <IconButton variant="outlined" label="Previous" disabled>
                  <ChevronIcon dir="left" />
                </IconButton>
                <IconButton variant="outlined" label="Next">
                  <ChevronIcon dir="right" />
                </IconButton>
              </div>
            }
          />
        </Kit>

        <Label only={only}>Buttons</Label>
        <Kit id="buttons" only={only} className="flex gap-[10px] flex-wrap">
          <Button href="#collections">Enter the gallery →</Button>
          <Button href="#notes" variant="line">
            Find by note
          </Button>
        </Kit>
        {!only && (
          <div className="flex gap-[16px] flex-wrap items-center mt-[16px]">
            <Button variant="add" done={added} onClick={() => setAdded((a) => !a)}>
              {added ? "Added" : "Add to bag"}
            </Button>
            <Button variant="link">Shop all best sellers</Button>
            <Button disabled>Disabled</Button>
            <IconButton label="Bag, 3 items" badge={3} bump>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                <path d="M5 8h14l-1.2 12.2H6.2Z" />
                <path d="M9 10V7a3 3 0 0 1 6 0v3" />
              </svg>
            </IconButton>
          </div>
        )}

        <Label only={only}>Product card</Label>
        <Kit id="card" only={only} className={only ? undefined : "w-[330px]"}>
          <ProductCard
            name={BERRY.name}
            href={BERRY.href}
            image={BERRY.image}
            tile="sky"
            price="AED 63"
            was="AED 90"
            discountPercent={30}
            tags={["EDP", "Unisex"]}
            family="Fruity · Strawberry · Pineapple"
            onAdd={() => setAdded(true)}
            added={added}
          />
        </Kit>

        {!only && (
          <>
            <Label>Chips, tabs, price, stars, stepper</Label>
            <div className="flex gap-[8px] flex-wrap">
              {[
                ["all", "All", 42],
                ["her", "For Her", 18],
                ["him", "For Him", 12],
              ].map(([v, l, n]) => (
                <Chip key={v} pressed={chip === v} count={n} onClick={() => setChip(String(v))}>
                  {l}
                </Chip>
              ))}
              <Chip dot="pink">Romantic</Chip>
              <Chip dot="butter">Playful</Chip>
            </div>
            <Tabs
              className="mt-[18px]"
              label="Shop by price"
              value={tab}
              onValueChange={setTab}
              items={[
                { value: "50", label: "Under AED 50", count: 6 },
                { value: "99", label: "Under AED 99", count: 24 },
                { value: "199", label: "Under AED 199", count: 61 },
              ]}
            />
            {["50", "99", "199"].map((v) => (
              <TabPanel key={v} value={v} active={tab === v} className="mt-[12px] text-sapil-ink-2">
                Bottles under AED {v}.
              </TabPanel>
            ))}
            <div className="flex gap-[24px] items-center mt-[18px]">
              <Price value="AED 63" was="AED 90" />
              <Stars rating={4} />
              <QuantityStepper value={qty} onChange={setQty} itemLabel="Berry Crush" />
              <QuantityStepper variant="big" value={qty} onChange={setQty} itemLabel="Berry Crush" />
            </div>
          </>
        )}

        <Label only={only}>Checkout steps</Label>
        <Kit id="steps" only={only}>
          <Steps
            steps={[
              { label: "Bag", hint: "1 item · AED 63", state: "done", onSelect: () => setDrawer(true), selectLabel: "Bag, done. Open your bag" },
              { label: "Delivery", hint: "Address and speed", state: "current" },
              { label: "Payment", hint: "Card, Tabby or cash", state: "upcoming" },
              { label: "Confirmation", hint: "Order placed", state: "upcoming" },
            ]}
          />
        </Kit>

        <Label only={only}>Fields</Label>
        <Kit id="fields" only={only} className={only ? undefined : "max-w-[779px]"}>
          <Fieldset legend="Contact">
            <FieldGrid>
              <Field label="Email" name="email" type="email" autoComplete="email" required placeholder="you@email.com" />
              <Field
                label="Mobile number"
                name="phone"
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                required
                placeholder="50 123 4567"
                prefix="+971"
              />
            </FieldGrid>
            <Checkbox name="news" defaultChecked>
              Send me new drops and offers by email
            </Checkbox>
          </Fieldset>
        </Kit>
        {!only && (
          <Fieldset legend="Delivery address" className="mt-[20px] max-w-[779px]">
            <FieldGrid>
              <Field wide label="Full name" placeholder="First and last name" error="Enter the name for the delivery." />
              <SelectField label="Emirate" defaultValue="">
                <option value="">Choose an emirate</option>
                <option>Dubai</option>
              </SelectField>
              <Field label="Apartment or villa" optional placeholder="e.g. Apt 1204" />
            </FieldGrid>
          </Fieldset>
        )}

        <Label only={only}>Radio cards</Label>
        <Kit id="radiocards" only={only} className={cx2(only, "bg-sapil-white")}>
          <RadioCardGroup
            name="pay"
            aria-label="Payment"
            defaultValue="card"
            options={[
              {
                value: "card",
                title: "Credit or debit card",
                description: "Visa, Mastercard, American Express",
                logos: (
                  <>
                    <CardLogo kind="visa" />
                    <CardLogo kind="mastercard" />
                  </>
                ),
                panel: (
                  <FieldGrid>
                    <Field wide label="Card number" inputMode="numeric" autoComplete="off" placeholder="1234 5678 9012 3456" maxLength={19} />
                    <Field label="Expiry date" inputMode="numeric" autoComplete="off" placeholder="MM / YY" maxLength={7} />
                    <Field label="Security code" inputMode="numeric" autoComplete="off" placeholder="3 digits" maxLength={4} />
                    <Field wide label="Name on card" autoComplete="off" placeholder="As printed on the card" />
                  </FieldGrid>
                ),
              },
              { value: "apple", title: "Apple Pay", description: "Pay with Face ID or Touch ID" },
              {
                value: "tabby",
                title: "Tabby: 4 interest-free payments",
                description: "AED 19.75 today, then every 2 weeks. No interest, no fees.",
                logos: <CardLogo kind="tabby" />,
              },
              { value: "cod", title: "Cash on delivery", description: "Pay the courier in cash or by card. AED 10 handling fee." },
            ]}
          />
        </Kit>

        {!only && (
          <>
            <Label>Accordion</Label>
            <Accordion
              name="faq"
              className="max-w-[560px]"
              items={[
                { id: "a", title: "How long does a bottle last?", content: "A 100ml bottle is about 1,000 sprays.", defaultOpen: true },
                { id: "b", title: "Can I return an opened bottle?", content: "Unopened bottles within 14 days." },
              ]}
            />
            <Label>Overlays</Label>
            <div className="flex gap-[10px] flex-wrap">
              <Button onClick={() => setDrawer(true)}>Open bag drawer</Button>
              <Button variant="line" onClick={() => setDialog(true)}>
                Open dialog
              </Button>
              <Button variant="line" onClick={() => setToast((t) => !t)}>
                Toggle toast
              </Button>
            </div>
          </>
        )}
      </Wrap>

      {!only && (
        <>
          <Drawer
            open={drawer}
            onClose={() => setDrawer(false)}
            title="Your bag"
            count={qty}
            ship={
              <FreeDeliveryCard percent={(63 * qty * 100) / 100} unlocked={63 * qty >= 100} title={63 * qty >= 100 ? "Free delivery unlocked" : `Add AED ${100 - 63 * qty} for free delivery`} detail="On orders over AED 100" />
            }
            footer={
              <>
                <SummaryRow label="Subtotal" value={`AED ${63 * qty}`} />
                <SummaryRow label="Delivery" value="Free" />
                <SummaryRow variant="total" label="Total" value={`AED ${63 * qty}`} />
                <Button href="#checkout" className="w-full !h-[44px]">
                  Checkout
                </Button>
              </>
            }
          >
            <BagLine
              name={BERRY.name}
              href={BERRY.href}
              imageSrc={BERRY.thumb}
              tile="sky"
              detail={`Juicy Pleasures · AED 63${qty > 1 ? " each" : ""}`}
              quantity={qty}
              onQuantityChange={(n) => setQty(Math.max(0, n))}
              total={`AED ${63 * qty}`}
              was={`AED ${90 * qty}`}
              onRemove={() => setQty(0)}
            />
          </Drawer>
          <Dialog open={dialog} onClose={() => setDialog(false)} label="Details">
            <div className="p-[44px_40px]">
              <h2 className="text-[40px]">Berry Crush</h2>
              <p className="text-sapil-ink-2 mt-[10px]">Wild berries with a sugar-dusted edge.</p>
            </div>
          </Dialog>
          <Toast
            open={toast}
            message="Berry Crush added to your bag"
            action={{ label: "View bag", onClick: () => { setToast(false); setDrawer(true); } }}
          />
        </>
      )}
    </div>
  );
}

function cx2(only: string | undefined, cls: string) {
  return only ? cls : `${cls} max-w-[731px]`;
}
