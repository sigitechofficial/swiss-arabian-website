"use client";

import { ChevronRight, LogOut, Package, ShoppingBag } from "lucide-react";

import { LocaleLink } from "@/lib/i18n/LocaleLink";
import { welcomeHeading } from "@/features/auth/utils/newAccountGreeting";
import { useAccountDashboard } from "../hooks/useAccountPages";
import { toOrderSummaryView } from "@/features/orders/utils/toOrderSummaryView";
import {
  accountAddressLines,
  accountAddressName,
  accountCol,
  accountEmpty,
  accountEyebrow,
  accountHead,
  accountHelpLink,
  accountHelpList,
  accountHelpNote,
  accountLayout,
  accountOrder,
  accountOrderCta,
  accountOrderHeadline,
  accountOrderMark,
  accountOrderMeta,
  accountPanel,
  accountPanelBody,
  accountPanelHead,
  accountPanelLink,
  accountPanelTitle,
  accountSignOut,
  accountTile,
  accountTileArrow,
  accountTileCopy,
  accountTileIcon,
  accountTileTitle,
  accountTiles,
} from "@/styles/accountChrome";
import { drawerEmptyCopy, drawerEmptyCta, drawerEmptyIcon, drawerEmptyTitle } from "@/styles/cartChrome";
import { pageTitle } from "@/styles/shopChrome";

import { accountContainer } from "../constants/accountLayout";
import { useEmployeeBenefitsAccount } from "@/features/employeeBenefits/hooks/useEmployeeBenefitsAccount";
import { accountQuickLinks, accountSupportLinks } from "../data/accountDashboardContent";
import { brandLinkEnabled } from "@/lib/brand/features";
import { countryNameForCode } from "../schemas/addressBook.schema";
import { AccountBreadcrumb } from "./AccountBreadcrumb";
import { AccountPageShell } from "./AccountPageShell";
import { AccountStatusPill } from "./AccountStatus";

type Dashboard = ReturnType<typeof useAccountDashboard>;

function RecentOrderPanel({ recentQuery }: { recentQuery: Dashboard["recentQuery"] }) {
  const recent = recentQuery.data?.items?.[0];
  const order = recent ? toOrderSummaryView(recent) : null;

  return (
    <section className={accountPanel} aria-labelledby="account-recent-order">
      <header className={accountPanelHead}>
        <h2 className={accountPanelTitle} id="account-recent-order">
          Recent order
        </h2>
        {order ? (
          <LocaleLink className={accountPanelLink} href="/account/orders">
            View all orders
            <ChevronRight size={14} className="rtl:rotate-180" aria-hidden="true" />
          </LocaleLink>
        ) : null}
      </header>

      {recentQuery.isPending ? (
        <div className={accountOrder} aria-busy="true">
          <span className={`${accountOrderMark} animate-pulse`} aria-hidden="true" />
          <p className={accountOrderMeta}>Loading your latest order…</p>
        </div>
      ) : order ? (
        <div className={accountOrder}>
          <span className={accountOrderMark} aria-hidden="true">
            <Package size={22} strokeWidth={1.6} />
          </span>
          <div className="min-w-0 flex-1 basis-[240px]">
            <p className={accountOrderHeadline}>{order.headline}</p>
            <p className={accountOrderMeta}>
              <span>
                Order <b>{order.reference}</b>
              </span>
              <i aria-hidden="true">·</i>
              <span>{order.dateLabel}</span>
              <i aria-hidden="true">·</i>
              <span>
                {order.itemCount} {order.itemCount === 1 ? "item" : "items"}
              </span>
            </p>
            <p className="m-0 mt-2.5">
              <AccountStatusPill label={order.statusLabel} tone={order.statusTone} />
            </p>
          </div>
          <LocaleLink className={accountOrderCta} href={`/account/orders/${order.id}`}>
            View order
          </LocaleLink>
        </div>
      ) : recentQuery.isError ? (
        // A failed request is not an empty history: do not tell a customer they have no orders.
        <div className={accountOrder}>
          <span className={accountOrderMark} aria-hidden="true">
            <Package size={22} strokeWidth={1.6} />
          </span>
          <div className="min-w-0 flex-1 basis-[240px]">
            <p className={accountOrderHeadline}>We couldn’t load your latest order</p>
            <p className={accountOrderMeta}>Your order history may still be available.</p>
          </div>
          <LocaleLink className={accountOrderCta} href="/account/orders">
            View orders
          </LocaleLink>
        </div>
      ) : (
        <div className={accountEmpty}>
          <span className={drawerEmptyIcon} aria-hidden="true">
            <ShoppingBag size={24} strokeWidth={1.6} />
          </span>
          <p className={drawerEmptyTitle}>No orders yet</p>
          <p className={drawerEmptyCopy}>Once you place an order, you can follow it from here.</p>
          <LocaleLink className={drawerEmptyCta} href="/products">
            Shop fragrances
          </LocaleLink>
        </div>
      )}
    </section>
  );
}

function ShortcutsPanel() {
  const { isEmployee } = useEmployeeBenefitsAccount();
  const links = accountQuickLinks.filter(
    (item) =>
      brandLinkEnabled(item.href) &&
      (item.href !== "/account/employee-benefits" || isEmployee),
  );
  return (
    <section className={accountPanel} aria-labelledby="account-shortcuts">
      <header className={accountPanelHead}>
        <h2 className={accountPanelTitle} id="account-shortcuts">
          Your account
        </h2>
      </header>
      <div className={accountTiles}>
        {links.map(({ icon: Icon, title, description, href }) => (
          <LocaleLink className={accountTile} href={href} key={href}>
            <span className={accountTileIcon} aria-hidden="true">
              <Icon size={18} strokeWidth={1.6} />
            </span>
            <span className="block min-w-0">
              <span className={`block ${accountTileTitle}`}>{title}</span>
              <span className={`block ${accountTileCopy}`}>{description}</span>
            </span>
            <ChevronRight className={accountTileArrow} size={16} aria-hidden="true" />
          </LocaleLink>
        ))}
      </div>
    </section>
  );
}

function AddressPanel({ addresses }: { addresses: Dashboard["addresses"] }) {
  const saved = Array.isArray(addresses.data) ? addresses.data : [];
  const primary = saved.find((address) => address.isDefaultShipping) ?? saved[0];
  const name = primary
    ? primary.fullName || [primary.firstName, primary.lastName].filter(Boolean).join(" ")
    : "";
  const lines = primary
    ? [
        [primary.address1, primary.address2].filter(Boolean).join(", "),
        [primary.city, primary.province].filter(Boolean).join(", "),
        primary.country || countryNameForCode(primary.countryCode ?? ""),
      ].filter(Boolean)
    : [];

  return (
    <section className={accountPanel} aria-labelledby="account-address">
      <header className={accountPanelHead}>
        <h2 className={accountPanelTitle} id="account-address">
          Delivery address
        </h2>
        <LocaleLink className={accountPanelLink} href="/account/addresses">
          {primary ? (saved.length > 1 ? `Manage ${saved.length}` : "Manage") : "Add"}
          <ChevronRight size={14} className="rtl:rotate-180" aria-hidden="true" />
        </LocaleLink>
      </header>
      <div className={accountPanelBody}>
        {primary ? (
          <>
            {name ? <p className={accountAddressName}>{name}</p> : null}
            <p className={accountAddressLines}>
              {lines.map((line) => (
                <span className="block" key={line}>
                  {line}
                </span>
              ))}
            </p>
          </>
        ) : (
          <p className={`${accountAddressLines} mt-0!`}>
            Save a delivery address and checkout fills it in for you.
          </p>
        )}
      </div>
    </section>
  );
}

function HelpPanel() {
  return (
    <section className={accountPanel} aria-labelledby="account-help">
      <header className={accountPanelHead}>
        <h2 className={accountPanelTitle} id="account-help">
          Need help?
        </h2>
      </header>
      <ul className={accountHelpList} role="list">
        {accountSupportLinks.map(({ icon: Icon, title, href }) => (
          <li key={href}>
            <LocaleLink className={accountHelpLink} href={href}>
              <Icon size={17} strokeWidth={1.6} aria-hidden="true" />
              {title}
              <ChevronRight size={15} aria-hidden="true" />
            </LocaleLink>
          </li>
        ))}
      </ul>
      <p className={accountHelpNote}>
        Returns can’t be started from your account yet. Contact customer care with your order number
        and we’ll take it from there.
      </p>
    </section>
  );
}

function DashboardContent() {
  const { firstName, isNew, recentQuery, addresses, logout: handleLogout } = useAccountDashboard();

  return (
    <>
      <AccountBreadcrumb label="Account" />
      <div className={accountContainer}>
        <header className={accountHead}>
          <div className="min-w-0">
            <p className={accountEyebrow}>My account</p>
            <h1 className={pageTitle}>{welcomeHeading(firstName, isNew)}</h1>
          </div>
          <button type="button" className={accountSignOut} onClick={handleLogout}>
            <LogOut size={15} strokeWidth={1.8} aria-hidden="true" />
            Sign out
          </button>
        </header>

        <div className={accountLayout}>
          <div className={accountCol}>
            <RecentOrderPanel recentQuery={recentQuery} />
            <ShortcutsPanel />
          </div>
          <aside className={accountCol} aria-label="Address and help">
            <AddressPanel addresses={addresses} />
            <HelpPanel />
          </aside>
        </div>
      </div>
    </>
  );
}

/** Account Dashboard */
export function AccountPageView() {
  return (
    <AccountPageShell>
      <DashboardContent />
    </AccountPageShell>
  );
}
