"use client";

import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAccountDashboard, useChangePassword } from "@/features/account/hooks/useAccountPages";
import { useCustomerAddresses } from "@/features/account/hooks/useCustomerAddresses";
import { useCustomerPhones } from "@/features/account/hooks/useCustomerPhones";
import { useMarketingConsents } from "@/features/account/hooks/useMarketingConsents";
import { useUpdateCustomerMe } from "@/features/account/hooks/useUpdateCustomerMe";
import { regionsForCountry } from "@/features/account/data/regionsByCountry";
import { countryLabel, regionLabel } from "@/features/account/utils/addressDisplay";
import { useShopLocale, useShopTranslator } from "@/lib/i18n/ShopLocaleProvider";
import {
  ADDRESS_COUNTRIES,
  addressBookSchema,
  addressFormToDto,
  type AddressBookFormValues,
} from "@/features/account/schemas/addressBook.schema";
import { profileNameSchema, type ProfileNameFormValues } from "@/features/account/schemas/phoneBook.schema";
import type { ConsentChannel, StorefrontCustomerAddressView } from "@/features/account/types/customerAccount";
import { useCustomerExchangesFeed, useCustomerReturnsFeed } from "@/features/afterSales/hooks/useAfterSales";
import { useMarketDialCode } from "@/features/auth/hooks/useAuthForms";
import { orderNeedsPaying, paymentFilterOf, usePaymentHistory, type PaymentFilter } from "@/features/payments/hooks/usePaymentHistory";
import { useMyReviewsFeed } from "@/features/reviews/hooks/useProductReviews";
import { useReviewMutations } from "@/features/reviews/hooks/useReviewMutations";
import { useAccountWishlist } from "@/features/wishlist/hooks/useAccountWishlist";
import { useWishlistMutations } from "@/features/wishlist/hooks/useWishlistMutations";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Button, Checkbox, Chip, Field, FieldGrid, SelectField, Stars } from "../../ui";
import { buttonClass } from "../../ui/Button";
import { cx } from "../../ui/shared";
import { useSapilCopy, type SapilTranslator } from "../../i18n/SapilCopy";
import type { SapilCopyKey } from "../../i18n/catalog";
import { SapilLink, SapilSkeleton, richText, useSapilDate, useSapilMoney } from "../../components/commerce/shared";
import { SapilPhoneField, isValidMobile } from "../../components/commerce/SapilPhoneField";
import { AccountPage, Card, LoadError, SAPIL_ACCOUNT_NAV, StatusPill, statusText } from "../../components/account/AccountChrome";
import { PasswordField } from "../../components/account/AuthFields";
import { SapilProductCard } from "../../components/product";
import { FormMessage } from "../../components/account/FormCard";

const linkBtn = cx(buttonClass("link"), "!text-[14px]");

function Loading() {
  return (
    <div aria-busy="true" className="flex flex-col gap-[14px]">
      <SapilSkeleton className="h-[120px] !rounded-[24px]" />
      <SapilSkeleton className="h-[120px] !rounded-[24px]" />
    </div>
  );
}

/* ——— dashboard ——— */

/** Saved address region / country in the page's language (stored values stay English). */
function useAddressPlaceNames() {
  const shopT = useShopTranslator();
  const locale = useShopLocale();
  return {
    region: (countryCode: string | null | undefined, region: string | null | undefined) =>
      region && countryCode ? regionLabel(countryCode, region, shopT) : region,
    country: (countryCode: string | null | undefined, saved: string | null | undefined) =>
      countryCode ? countryLabel(countryCode, locale, saved) : saved,
  };
}

export function SapilAccountPage() {
  const t = useSapilCopy();
  const place = useAddressPlaceNames();
  const money = useSapilMoney();
  const date = useSapilDate();
  const { firstName, isNew, recentQuery, recentOrder, addresses, logout } = useAccountDashboard();
  const saved = Array.isArray(addresses.data) ? addresses.data : [];
  const primary = saved.find((a) => a.isDefaultShipping) ?? saved[0];
  return (
    <AccountPage
      crumb={t("account.account")}
      title={firstName ? (isNew ? t("account.dashWelcome") : t("account.dashWelcomeBack")) : t("account.dashWelcomeNoName")}
      accent={firstName ? `${firstName}.` : undefined}
      actions={
        <Button variant="line" onClick={() => void logout()}>
          {t("account.signOut")}
        </Button>
      }
    >
      <div className="grid grid-cols-[minmax(0,7fr)_minmax(0,5fr)] gap-[20px] items-start max-900:grid-cols-[1fr]">
        <div className="flex flex-col gap-[20px]">
          <Card title={t("account.dashRecent")} id="acc-recent">
            {recentQuery.isPending ? (
              <SapilSkeleton className="h-[60px]" />
            ) : recentOrder ? (
              <div className="flex items-center justify-between gap-[12px] flex-wrap mt-[8px]">
                <div>
                  <SapilLink href={`/account/orders/${encodeURIComponent(recentOrder.orderId)}`} className="font-[700] hover:underline">
                    <span dir="ltr">{recentOrder.orderNumber ?? recentOrder.orderId.slice(0, 8).toUpperCase()}</span>
                  </SapilLink>
                  <p className="text-[14px] text-sapil-ink-2">
                    {date(recentOrder.createdAt)} · {t("account.ordersItems", { count: recentOrder.itemCount })} ·{" "}
                    {money(Number(recentOrder.total), recentOrder.currency)}
                  </p>
                </div>
                <StatusPill status={recentOrder.status} label={statusText(t, recentOrder.status)} />
              </div>
            ) : (
              <p className="text-sapil-ink-2 mt-[8px]">
                {t("account.dashRecentNone")}{" "}
                <SapilLink href="/products" className={linkBtn}>
                  {t("account.dashShop")}
                </SapilLink>
              </p>
            )}
            <SapilLink href="/account/orders" className={cx(linkBtn, "inline-block mt-[14px]")}>
              {t("account.dashAllOrders")}
            </SapilLink>
          </Card>
          <Card title={t("account.dashShortcuts")} id="acc-tiles">
            <ul className="list-none grid grid-cols-2 gap-[10px] mt-[10px] max-600:grid-cols-[1fr]">
              {SAPIL_ACCOUNT_NAV.map((item) => (
                <li key={item.href}>
                  <SapilLink
                    href={item.href}
                    className="block rounded-[16px] border border-sapil-line-2 py-[14px] px-[16px] hover:border-sapil-ink [transition:border-color_.18s]"
                  >
                    <b className="block text-[15px] font-[600]">{t(item.label)}</b>
                    <small className="block text-[13px] text-sapil-muted">{t(item.tile)}</small>
                  </SapilLink>
                </li>
              ))}
            </ul>
          </Card>
        </div>
        <aside className="flex flex-col gap-[20px]">
          <Card title={t("account.dashAddress")} headingLevel="h3" id="acc-address">
            {primary ? (
              <p className="text-[15px] leading-[1.55]">
                <b>{primary.fullName || [primary.firstName, primary.lastName].filter(Boolean).join(" ")}</b>
                <br />
                {[primary.address1, primary.address2].filter(Boolean).join(", ")}
                <br />
                {[primary.city, place.region(primary.countryCode, primary.province)].filter(Boolean).join(", ")}
              </p>
            ) : (
              <p className="text-sapil-ink-2 text-[15px]">{t("account.dashAddressNone")}</p>
            )}
            <SapilLink href="/account/addresses" className={cx(linkBtn, "inline-block mt-[12px]")}>
              {primary ? t("account.dashManage") : t("account.dashAdd")}
            </SapilLink>
          </Card>
          <div className="rounded-[24px] py-[24px] px-[26px] bg-sapil-p-sky">
            <h3 className="font-sapil-sans font-[600] text-[13px] leading-[normal] tracking-[.1em] uppercase text-sapil-muted mb-[10px]">
              {t("account.dashHelp")}
            </h3>
            <p className="text-[15px]">{t("account.dashHelpBody")}</p>
            <Button href="/track" LinkComponent={SapilLink} className="mt-[14px] !h-[44px] !px-[18px] !text-[14px]">
              {t("account.dashTrack")}
            </Button>
          </div>
        </aside>
      </div>
    </AccountPage>
  );
}

/* ——— profile ——— */

function NameForm({ onDone }: { onDone: () => void }) {
  const t = useSapilCopy();
  const user = useCurrentUser();
  const updateMe = useUpdateCustomerMe();
  const form = useForm<ProfileNameFormValues>({
    resolver: zodResolver(profileNameSchema),
    defaultValues: { firstName: user?.firstName ?? "", lastName: user?.lastName ?? "" },
  });
  return (
    <form
      noValidate
      className="mt-[12px]"
      onSubmit={form.handleSubmit(async (values) => {
        await updateMe.unwrap({ firstName: values.firstName.trim(), lastName: values.lastName?.trim() || undefined });
        onDone();
      })}
    >
      <FieldGrid>
        <Field
          id="pf-first"
          autoComplete="given-name"
          label={t("account.profileFirstName")}
          {...form.register("firstName")}
          error={form.formState.errors.firstName ? t("account.authErrFullName") : undefined}
        />
        <Field id="pf-last" autoComplete="family-name" label={t("account.profileLastName")} {...form.register("lastName")} />
      </FieldGrid>
      <div className="flex gap-[12px] items-center mt-[14px]">
        <Button type="submit" disabled={updateMe.isPending}>
          {updateMe.isPending ? t("account.saving") : t("account.save")}
        </Button>
        <button type="button" className={linkBtn} onClick={onDone}>
          {t("account.cancel")}
        </button>
      </div>
    </form>
  );
}

const CONSENT_CHANNELS: ConsentChannel[] = ["EMAIL", "SMS", "WHATSAPP"];

export function SapilAccountProfilePage() {
  const t = useSapilCopy();
  const user = useCurrentUser();
  const [editingName, setEditingName] = useState(false);
  const phones = useCustomerPhones();
  const consents = useMarketingConsents();
  const dial = useMarketDialCode();
  const [newPhone, setNewPhone] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const optedIn = (channel: string) => (consents.list.data ?? []).some((c) => c.channel === channel && c.status === "OPTED_IN");
  const name = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.fullName || "";

  return (
    <AccountPage crumb={t("account.profileTitle")} title={t("account.profileTitle")} lede={t("account.profileLede")}>
      <div className="flex flex-col gap-[20px] max-w-[860px]">
        <Card title={t("account.profileName")} headingLevel="h3">
          {editingName ? (
            <NameForm onDone={() => setEditingName(false)} />
          ) : (
            <div className="flex justify-between items-center gap-[12px]">
              <p className="text-[16px]">{name}</p>
              <button type="button" className={linkBtn} onClick={() => setEditingName(true)}>
                {t("account.edit")}
              </button>
            </div>
          )}
        </Card>
        <Card title={t("account.profileEmail")} headingLevel="h3">
          <p className="text-[16px]" dir="ltr">
            {user?.email}
          </p>
        </Card>
        <Card title={t("account.profilePhones")} headingLevel="h3">
          {phones.list.isPending ? (
            <SapilSkeleton className="h-[44px]" />
          ) : phones.list.isError ? (
            <LoadError onRetry={() => void phones.list.refetch()} />
          ) : (
            <ul className="list-none">
              {(phones.list.data ?? []).length === 0 ? <li className="text-sapil-ink-2">{t("account.profilePhoneNone")}</li> : null}
              {(phones.list.data ?? []).map((phone) => (
                <li key={phone.id} className="flex items-center justify-between gap-[12px] flex-wrap py-[10px] border-b border-sapil-line last:border-b-0">
                  <span dir="ltr" className="font-[600]">
                    {phone.phoneE164}
                  </span>
                  <span className="flex items-center gap-[12px]">
                    {phone.isPrimary ? <StatusPill status="PAID" label={t("account.profilePhonePrimary")} /> : null}
                    {!phone.isPrimary ? (
                      <button type="button" className={linkBtn} onClick={() => void phones.setPrimary.mutate(phone.id)}>
                        {t("account.profilePhoneMakePrimary")}
                      </button>
                    ) : null}
                    <button type="button" className={linkBtn} onClick={() => void phones.remove.mutate(phone.id)}>
                      {t("account.remove")}
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          )}
          <form
            noValidate
            className="mt-[14px] flex items-end gap-[10px] flex-wrap"
            onSubmit={(event) => {
              event.preventDefault();
              if (!isValidMobile(newPhone)) return setPhoneError(t("account.authErrMobile"));
              setPhoneError(null);
              void phones.create.unwrap({ phone: newPhone }).then(() => setNewPhone(""));
            }}
          >
            <div className="flex-1 min-w-[220px]">
              <SapilPhoneField
                id="pf-phone"
                label={t("account.profilePhoneAdd")}
                dialCode={dial}
                value={newPhone}
                onChange={setNewPhone}
                error={phoneError ?? undefined}
              />
            </div>
            <Button type="submit" variant="line" disabled={phones.create.isPending}>
              {phones.create.isPending ? t("account.saving") : t("account.save")}
            </Button>
          </form>
        </Card>
        <Card title={t("account.profileConsents")} headingLevel="h3">
          <p className="text-[14px] text-sapil-ink-2">{t("account.profileConsentsLede")}</p>
          {consents.list.isError ? <LoadError onRetry={() => void consents.list.refetch()} /> : null}
          {CONSENT_CHANNELS.map((channel) => (
            <Checkbox
              key={channel}
              checked={optedIn(channel)}
              disabled={consents.list.isPending || consents.update.isPending}
              onChange={(event) =>
                consents.update.mutate({ consents: [{ channel, status: event.target.checked ? "OPTED_IN" : "OPTED_OUT" }] })
              }
            >
              {t(`account.consent${channel}` as SapilCopyKey)}
            </Checkbox>
          ))}
        </Card>
      </div>
    </AccountPage>
  );
}

/* ——— addresses ——— */

function AddressForm({
  initial,
  isFirst,
  submitting,
  onCancel,
  onSubmit,
}: {
  initial?: StorefrontCustomerAddressView;
  isFirst: boolean;
  submitting: boolean;
  onCancel: () => void;
  onSubmit: (values: AddressBookFormValues) => Promise<void>;
}) {
  const t = useSapilCopy();
  const shopT = useShopTranslator();
  const locale = useShopLocale();
  const form = useForm<AddressBookFormValues>({
    resolver: zodResolver(addressBookSchema),
    defaultValues: {
      firstName: initial?.firstName ?? "",
      lastName: initial?.lastName ?? "",
      address1: initial?.address1 ?? "",
      address2: initial?.address2 ?? "",
      city: initial?.city ?? "",
      province: initial?.province ?? "",
      countryCode: initial?.countryCode || "AE",
      phone: initial?.phoneE164 ?? "",
      isDefaultShipping: initial?.isDefaultShipping ?? isFirst,
      isDefaultBilling: initial?.isDefaultBilling ?? isFirst,
    },
  });
  const country = useWatch({ control: form.control, name: "countryCode" });
  const phone = useWatch({ control: form.control, name: "phone" });
  const regions = regionsForCountry(country)?.regions ?? [];
  const errors = form.formState.errors;
  const dial = useMarketDialCode();
  return (
    <Card title={initial ? t("account.addressesEditTitle") : t("account.addressesNew")} headingLevel="h3">
      <form noValidate onSubmit={form.handleSubmit(onSubmit)}>
        <FieldGrid>
          <Field id="ad-first" autoComplete="given-name" label={t("account.profileFirstName")} {...form.register("firstName")} />
          <Field id="ad-last" autoComplete="family-name" label={t("account.profileLastName")} {...form.register("lastName")} />
          <SelectField id="ad-country" label={t("account.addressesCountry")} {...form.register("countryCode")}>
            {ADDRESS_COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {countryLabel(c.code, locale, c.name)}
              </option>
            ))}
          </SelectField>
          <SelectField id="ad-region" label={t("account.addressesRegion")} optional={t("account.optional")} {...form.register("province")}>
            <option value="">—</option>
            {regions.map((region) => (
              <option key={region} value={region}>
                {regionLabel(country, region, shopT)}
              </option>
            ))}
          </SelectField>
          <Field
            id="ad-street"
            wide
            autoComplete="address-line1"
            label={t("account.addressesStreet")}
            {...form.register("address1")}
            error={errors.address1 ? t("checkout.streetError") : undefined}
          />
          <Field id="ad-apt" autoComplete="address-line2" label={t("account.addressesApartment")} optional={t("account.optional")} {...form.register("address2")} />
          <Field
            id="ad-city"
            autoComplete="address-level2"
            label={t("account.addressesCity")}
            {...form.register("city")}
            error={errors.city ? t("checkout.areaError") : undefined}
          />
          <SapilPhoneField
            id="ad-phone"
            label={t("account.addressesPhone")}
            dialCode={dial}
            value={phone ?? ""}
            onChange={(value) => form.setValue("phone", value, { shouldValidate: Boolean(errors.phone) })}
            error={errors.phone ? t("account.authErrMobile") : undefined}
            wide
          />
        </FieldGrid>
        <Checkbox {...form.register("isDefaultShipping")}>{t("account.addressesMakeDefault")}</Checkbox>
        <div className="flex gap-[12px] items-center mt-[18px]">
          <Button type="submit" disabled={submitting}>
            {submitting ? t("account.saving") : t("account.save")}
          </Button>
          <button type="button" className={linkBtn} onClick={onCancel}>
            {t("account.cancel")}
          </button>
        </div>
      </form>
    </Card>
  );
}

export function SapilAccountAddressesPage() {
  const t = useSapilCopy();
  const place = useAddressPlaceNames();
  const { list, create, update, remove, setDefault } = useCustomerAddresses();
  const [mode, setMode] = useState<"idle" | "create" | string>("idle");
  const [confirming, setConfirming] = useState<string | null>(null);
  const addresses = list.data ?? [];
  return (
    <AccountPage
      crumb={t("account.addressesTitle")}
      title={t("account.addressesTitle")}
      lede={t("account.addressesLede")}
      actions={
        mode === "idle" && addresses.length ? (
          <Button onClick={() => setMode("create")}>{t("account.addressesAdd")}</Button>
        ) : undefined
      }
    >
      {list.isPending ? (
        <Loading />
      ) : list.isError ? (
        <LoadError onRetry={() => void list.refetch()} />
      ) : (
        <div className="grid grid-cols-2 gap-[20px] items-start max-900:grid-cols-[1fr]">
          {mode === "create" ? (
            <AddressForm
              isFirst={addresses.length === 0}
              submitting={create.isPending}
              onCancel={() => setMode("idle")}
              onSubmit={async (values) => {
                await create.unwrap(addressFormToDto(values));
                setMode("idle");
              }}
            />
          ) : null}
          {addresses.length === 0 && mode === "idle" ? (
            <Card className="col-span-full text-center">
              <p className="text-sapil-ink-2 mb-[16px]">{t("account.addressesNone")}</p>
              <Button onClick={() => setMode("create")}>{t("account.addressesAdd")}</Button>
            </Card>
          ) : null}
          {addresses.map((address) =>
            mode === address.id ? (
              <AddressForm
                key={address.id}
                initial={address}
                isFirst={false}
                submitting={update.isPending}
                onCancel={() => setMode("idle")}
                onSubmit={async (values) => {
                  await update.unwrap({ addressId: address.id, dto: addressFormToDto(values) });
                  setMode("idle");
                }}
              />
            ) : (
              <Card key={address.id}>
                <div className="flex justify-between gap-[12px]">
                  <p className="text-[15px] leading-[1.55]">
                    <b>{address.fullName || [address.firstName, address.lastName].filter(Boolean).join(" ")}</b>
                    <br />
                    {[address.address1, address.address2].filter(Boolean).join(", ")}
                    <br />
                    {[
                      address.city,
                      place.region(address.countryCode, address.province),
                      place.country(address.countryCode, address.country),
                    ]
                      .filter(Boolean)
                      .join(", ")}
                    {address.phoneE164 ? (
                      <>
                        <br />
                        <span dir="ltr">{address.phoneE164}</span>
                      </>
                    ) : null}
                  </p>
                  {address.isDefaultShipping ? <StatusPill status="PAID" label={t("account.addressesDefault")} /> : null}
                </div>
                {confirming === address.id ? (
                  <div className="flex items-center gap-[12px] flex-wrap mt-[14px]" role="group">
                    <span className="text-[14px]">{t("account.addressesRemoveConfirm")}</span>
                    <Button
                      onClick={() => void remove.unwrap(address.id).finally(() => setConfirming(null))}
                      disabled={remove.isPending}
                      className="!h-[40px] !px-[16px] !text-[14px]"
                    >
                      {t("account.addressesYesRemove")}
                    </Button>
                    <button type="button" className={linkBtn} onClick={() => setConfirming(null)}>
                      {t("account.addressesKeep")}
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-[16px] flex-wrap mt-[14px]">
                    <button type="button" className={linkBtn} onClick={() => setMode(address.id)}>
                      {t("account.edit")}
                    </button>
                    {!address.isDefaultShipping ? (
                      <button
                        type="button"
                        className={linkBtn}
                        onClick={() => setDefault.mutate({ addressId: address.id, target: "shipping" })}
                      >
                        {t("account.addressesMakeDefault")}
                      </button>
                    ) : null}
                    <button type="button" className={linkBtn} onClick={() => setConfirming(address.id)}>
                      {t("account.remove")}
                    </button>
                  </div>
                )}
              </Card>
            ),
          )}
        </div>
      )}
    </AccountPage>
  );
}

/* ——— security ——— */

export function SapilAccountSecurityPage() {
  const t = useSapilCopy();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const { form, submit } = useChangePassword({ onDone: () => setDone(true), onError: setError });
  const errors = form.formState.errors;
  return (
    <AccountPage crumb={t("account.securityTitle")} title={t("account.securityTitle")} lede={t("account.securityLede")}>
      <div className="max-w-[560px]">
        <Card title={t("account.securityChange")}>
          <p className="text-[14px] text-sapil-ink-2 mb-[18px]">{t("account.securityChangeLede")}</p>
          {error ? <FormMessage tone="error">{error}</FormMessage> : null}
          {done ? <FormMessage tone="ok">{t("account.securityDone")}</FormMessage> : null}
          <form noValidate onSubmit={submit} className="flex flex-col gap-[14px]">
            <PasswordField
              id="currentPassword"
              autoComplete="current-password"
              label={t("account.securityCurrent")}
              {...form.register("currentPassword")}
              error={errors.currentPassword ? t("account.securityErrCurrent") : undefined}
            />
            <PasswordField
              id="newPassword"
              autoComplete="new-password"
              label={t("account.securityNew")}
              {...form.register("newPassword")}
              error={errors.newPassword ? t("account.securityErrNew") : undefined}
            />
            <PasswordField
              id="confirmPassword"
              autoComplete="new-password"
              label={t("account.securityConfirm")}
              {...form.register("confirmPassword")}
              error={errors.confirmPassword ? t("account.securityErrConfirm") : undefined}
            />
            <Button type="submit" disabled={form.formState.isSubmitting || done} className="mt-[6px] w-fit">
              {form.formState.isSubmitting ? t("account.securitySubmitting") : t("account.securitySubmit")}
            </Button>
          </form>
        </Card>
        <p className="mt-[14px] text-[14px] text-sapil-ink-2">
          {richText(t("account.securityForgot"), {
            link: (
              <SapilLink href="/forgot-password" className="underline">
                {t("account.securityForgotLink")}
              </SapilLink>
            ),
          })}
        </p>
      </div>
    </AccountPage>
  );
}

/* ——— wishlist ——— */

export function SapilAccountWishlistPage() {
  const t = useSapilCopy();
  const wishlist = useAccountWishlist();
  const { remove } = useWishlistMutations();
  return (
    <AccountPage
      crumb={t("account.wishlistTitle")}
      title={t("account.wishlistTitle")}
      lede={wishlist.total > 0 ? t("account.wishlistCount", { count: wishlist.total }) : t("account.wishlistEmpty")}
      actions={
        wishlist.total > 0 ? (
          wishlist.confirmClear ? (
            <span className="flex items-center gap-[12px]" role="group">
              <span className="text-[14px]">{t("account.wishlistClearConfirm")}</span>
              <Button onClick={wishlist.clearAll} disabled={wishlist.clear.isPending} className="!h-[40px] !px-[16px] !text-[14px]">
                {wishlist.clear.isPending ? t("account.wishlistClearing") : t("account.wishlistClearYes")}
              </Button>
              <button type="button" className={linkBtn} onClick={() => wishlist.setConfirmClear(false)}>
                {t("account.cancel")}
              </button>
            </span>
          ) : (
            <Button variant="line" onClick={() => wishlist.setConfirmClear(true)}>
              {t("account.wishlistClear")}
            </Button>
          )
        ) : undefined
      }
    >
      {wishlist.isLoading ? (
        <Loading />
      ) : wishlist.isError ? (
        <LoadError onRetry={() => void wishlist.refetch()} />
      ) : wishlist.cards.length === 0 ? (
        <Card className="text-center">
          <p className="text-sapil-ink-2 mb-[16px]">{t("account.wishlistEmpty")}</p>
          <Button href="/products" LinkComponent={SapilLink}>
            {t("account.dashShop")}
          </Button>
        </Card>
      ) : (
        <>
          <ul className="list-none grid grid-cols-4 gap-x-[24px] gap-y-[40px] max-1100:grid-cols-3 max-760:grid-cols-2" aria-busy={wishlist.isFetching}>
            {wishlist.cards.map(({ item, card }, index) => {
              const name = card?.title ?? item.product?.name ?? "";
              return (
                <li key={item.productId} className="relative">
                  {card ? (
                    <SapilProductCard
                      product={item.product?.isSellable === false ? { ...card, isSellable: false } : card}
                      imagePriority={index < 4 ? "eager" : "lazy"}
                      imageSizes="(max-width: 760px) 50vw, (max-width: 1100px) 33vw, 300px"
                      wishlist={false}
                    />
                  ) : (
                    <p className="text-sapil-ink-2">{t("account.wishlistUnavailable")}</p>
                  )}
                  <button
                    type="button"
                    onClick={() => remove.mutate(item.productId)}
                    aria-label={t("account.wishlistRemove", { name })}
                    className={cx(linkBtn, "mt-[8px] !text-[13px]")}
                  >
                    {t("account.remove")}
                  </button>
                </li>
              );
            })}
          </ul>
          {wishlist.totalPages > 1 ? (
            <nav className="flex items-center justify-center gap-[12px] mt-[32px]" aria-label={t("account.wishlistTitle")}>
              {wishlist.page > 1 ? (
                <Button href={`/account/wishlist?page=${wishlist.page - 1}`} variant="line" LinkComponent={SapilLink}>
                  {t("account.wishlistPrev")}
                </Button>
              ) : null}
              <span className="text-[14px] text-sapil-muted">{t("account.wishlistPage", { page: wishlist.page, pages: wishlist.totalPages })}</span>
              {wishlist.page < wishlist.totalPages ? (
                <Button href={`/account/wishlist?page=${wishlist.page + 1}`} variant="line" LinkComponent={SapilLink}>
                  {t("account.wishlistNext")}
                </Button>
              ) : null}
            </nav>
          ) : null}
        </>
      )}
    </AccountPage>
  );
}

/* ——— reviews ——— */

const REVIEW_FILTERS: Array<{ value: string | null; label: SapilCopyKey }> = [
  { value: null, label: "account.reviewsAll" },
  { value: "APPROVED", label: "account.reviewsPublished" },
  { value: "PENDING", label: "account.reviewsPending" },
  { value: "REJECTED", label: "account.reviewsRejected" },
];

function reviewStatusLabel(t: SapilTranslator, status: string): string {
  const key = REVIEW_FILTERS.find((f) => f.value === status.toUpperCase())?.label;
  return key ? t(key) : statusText(t, status);
}

export function SapilAccountReviewsPage() {
  const t = useSapilCopy();
  const date = useSapilDate();
  const [status, setStatus] = useState<string | null>(null);
  const feed = useMyReviewsFeed(status);
  const { remove } = useReviewMutations();
  const items = useMemo(() => feed.data?.pages.flatMap((page) => page.items) ?? [], [feed.data]);
  return (
    <AccountPage crumb={t("account.reviewsTitle")} title={t("account.reviewsTitle")} lede={t("account.reviewsLede")}>
      <div className="flex gap-[8px] flex-wrap mb-[20px]" role="group" aria-label={t("account.reviewsTitle")}>
        {REVIEW_FILTERS.map((filter) => (
          <Chip key={filter.label} pressed={status === filter.value} onClick={() => setStatus(filter.value)}>
            {t(filter.label)}
          </Chip>
        ))}
      </div>
      {feed.isLoading && !items.length ? (
        <Loading />
      ) : feed.isError && !items.length ? (
        <LoadError onRetry={() => void feed.refetch()} />
      ) : !items.length ? (
        <Card className="text-center">
          <p className="text-sapil-ink-2">{status ? t("account.reviewsEmptyFiltered") : t("account.reviewsEmpty")}</p>
        </Card>
      ) : (
        <ul className="list-none flex flex-col gap-[14px]">
          {items.map((review) => (
            <li key={review.reviewId}>
              <Card>
                <div className="flex justify-between gap-[12px] flex-wrap">
                  <div>
                    {review.product?.slug ? (
                      <SapilLink href={`/products/${review.product.slug}`} className="font-[600] hover:underline">
                        {review.product.name}
                      </SapilLink>
                    ) : (
                      <b className="font-[600]">{review.product?.name}</b>
                    )}
                    <div className="flex items-center gap-[10px] mt-[4px]">
                      <Stars rating={review.rating} size={16} />
                      <small className="text-[13px] text-sapil-muted">{date(review.createdAt)}</small>
                    </div>
                  </div>
                  <StatusPill status={review.status === "APPROVED" ? "DELIVERED" : review.status} label={reviewStatusLabel(t, review.status)} />
                </div>
                {review.title ? <p className="font-[600] mt-[10px]">{review.title}</p> : null}
                {review.body ? <p className="text-sapil-ink-2 mt-[4px]">{review.body}</p> : null}
                <button
                  type="button"
                  className={cx(linkBtn, "mt-[12px] !text-[13px]")}
                  disabled={remove.isPending}
                  onClick={() => remove.mutate(review.reviewId)}
                >
                  {remove.isPending ? t("account.reviewsDeleting") : t("account.reviewsDelete")}
                </button>
              </Card>
            </li>
          ))}
        </ul>
      )}
      {feed.hasNextPage ? (
        <div className="text-center mt-[20px]">
          <Button variant="line" onClick={() => void feed.fetchNextPage()} disabled={feed.isFetchingNextPage}>
            {t("account.reviewsMore")}
          </Button>
        </div>
      ) : null}
    </AccountPage>
  );
}

/* ——— returns & exchanges ——— */

export function SapilAccountAfterSalesPage() {
  const t = useSapilCopy();
  const date = useSapilDate();
  const [kind, setKind] = useState<"returns" | "exchanges">("returns");
  const returns = useCustomerReturnsFeed(null);
  const exchanges = useCustomerExchangesFeed(null);
  const feed = kind === "returns" ? returns : exchanges;
  const rows = useMemo(
    () =>
      kind === "returns"
        ? (returns.data?.pages.flatMap((p) => p.items) ?? []).map((r) => ({
            id: r.returnRequestId,
            number: r.returnNumber,
            orderId: r.orderId,
            orderNumber: r.orderNumber,
            status: r.status,
            message: r.latestStatusMessage,
            itemCount: r.itemCount,
            createdAt: r.createdAt,
          }))
        : (exchanges.data?.pages.flatMap((p) => p.items) ?? []).map((r) => ({
            id: r.exchangeRequestId,
            number: r.exchangeNumber,
            orderId: r.orderId,
            orderNumber: r.orderNumber,
            status: r.status,
            message: r.latestStatusMessage,
            itemCount: r.itemCount,
            createdAt: r.createdAt,
          })),
    [kind, returns.data, exchanges.data],
  );
  return (
    <AccountPage crumb={t("account.returnsTitle")} title={t("account.returnsTitle")} lede={t("account.returnsLede")}>
      <div className="flex gap-[8px] flex-wrap mb-[20px]" role="group" aria-label={t("account.returnsTitle")}>
        <Chip pressed={kind === "returns"} onClick={() => setKind("returns")}>
          {t("account.returnsReturns")}
        </Chip>
        <Chip pressed={kind === "exchanges"} onClick={() => setKind("exchanges")}>
          {t("account.returnsExchanges")}
        </Chip>
      </div>
      {feed.isLoading ? (
        <Loading />
      ) : feed.isError ? (
        <LoadError onRetry={() => void feed.refetch()} />
      ) : !rows.length ? (
        <Card className="text-center">
          <p className="text-sapil-ink-2">{t("account.returnsEmpty")}</p>
        </Card>
      ) : (
        <ul className="list-none bg-sapil-white rounded-[24px] py-[6px] px-[20px]">
          {rows.map((row) => (
            <li key={row.id} className="flex justify-between gap-[12px] flex-wrap py-[14px] border-b border-sapil-line last:border-b-0">
              <div>
                <b className="font-[700]" dir="ltr">
                  {row.number}
                </b>
                <p className="text-[14px] text-sapil-ink-2">
                  {t("account.returnsRequested", { date: date(row.createdAt) })} · {t("account.returnsItems", { count: row.itemCount })}
                  {row.orderNumber ? (
                    <>
                      {" · "}
                      <SapilLink href={`/account/orders/${encodeURIComponent(row.orderId)}`} className="underline" dir="ltr">
                        {row.orderNumber}
                      </SapilLink>
                    </>
                  ) : null}
                </p>
                {row.message ? <p className="text-[13px] text-sapil-muted mt-[2px]">{row.message}</p> : null}
              </div>
              <StatusPill status={row.status} label={statusText(t, row.status)} />
            </li>
          ))}
        </ul>
      )}
      {feed.hasNextPage ? (
        <div className="text-center mt-[20px]">
          <Button variant="line" onClick={() => void feed.fetchNextPage()} disabled={feed.isFetchingNextPage}>
            {t("account.returnsMore")}
          </Button>
        </div>
      ) : null}
      <p className="mt-[20px] text-[14px] text-sapil-ink-2">
        {richText(t("account.returnsStart"), {
          link: (
            <SapilLink href="/account/orders" className="underline">
              {t("account.returnsOrdersLink")}
            </SapilLink>
          ),
        })}
      </p>
    </AccountPage>
  );
}

/* ——— payments ——— */

const PAYMENT_FILTERS: Array<{ value: PaymentFilter; label: SapilCopyKey }> = [
  { value: "all", label: "account.paymentsAll" },
  { value: "paid", label: "account.paymentsPaid" },
  { value: "pending", label: "account.paymentsPendingFilter" },
  { value: "refunded", label: "account.paymentsRefunds" },
];

export function SapilPaymentsPage() {
  const t = useSapilCopy();
  const money = useSapilMoney();
  const date = useSapilDate();
  const { query, filter, setFilter, rows, hasAny } = usePaymentHistory();
  return (
    <AccountPage crumb={t("account.paymentsTitle")} title={t("account.paymentsTitle")} lede={t("account.paymentsLede")}>
      <div className="flex gap-[8px] flex-wrap mb-[20px]" role="group" aria-label={t("account.paymentsTitle")}>
        {PAYMENT_FILTERS.map((f) => (
          <Chip key={f.value} pressed={filter === f.value} onClick={() => setFilter(f.value)}>
            {t(f.label)}
          </Chip>
        ))}
      </div>
      {query.isPending ? (
        <Loading />
      ) : query.isError ? (
        <LoadError onRetry={() => void query.refetch()} />
      ) : !rows.length ? (
        <Card className="text-center">
          <p className="text-sapil-ink-2">{hasAny ? t("account.paymentsNoneFiltered") : t("account.paymentsNone")}</p>
        </Card>
      ) : (
        <ul className="list-none bg-sapil-white rounded-[24px] py-[6px] px-[20px]">
          {rows.map((order) => {
            const payKey = `account.pay${order.paymentStatus.toUpperCase()}` as SapilCopyKey;
            const payLabel = t(payKey) === payKey ? statusText(t, order.paymentStatus) : t(payKey);
            const kind = paymentFilterOf(order.paymentStatus);
            return (
              <li key={order.orderId} className="grid grid-cols-[1fr_1fr_auto_auto] gap-[16px] items-center py-[14px] border-b border-sapil-line last:border-b-0 text-[15px] max-900:grid-cols-[1fr_auto]">
                <SapilLink href={`/account/orders/${encodeURIComponent(order.orderId)}`} className="font-[700] hover:underline" dir="ltr">
                  {order.orderNumber ?? order.orderId.slice(0, 8).toUpperCase()}
                </SapilLink>
                <span className="text-sapil-ink-2">{date(order.createdAt)}</span>
                <span className={cx("font-[600] tabular-nums", kind === "refunded" && "text-sapil-sale")}>
                  {money(Number(order.total), order.currency)}
                </span>
                <span className="flex items-center gap-[12px] justify-end">
                  <StatusPill status={kind === "paid" ? "PAID" : kind === "pending" ? "PAYMENT_PENDING" : order.paymentStatus} label={payLabel} />
                  {orderNeedsPaying(order) ? (
                    <SapilLink href={`/checkout/payment/cancel?orderId=${encodeURIComponent(order.orderId)}`} className={cx(linkBtn, "!text-[13px]")}>
                      {t("account.paymentsComplete")}
                    </SapilLink>
                  ) : null}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </AccountPage>
  );
}
