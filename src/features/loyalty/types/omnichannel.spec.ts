import { describe, expect, it } from "vitest";
import { readLoyaltyActivityPage, readLoyaltyWallet } from "./loyalty";
import {
  formatPointQuantity,
  readExternalLoyaltyActivity,
  readOmnichannelLoyalty,
  externalActivityLabel,
  canRequestOmnichannelRefresh,
  omnichannelRefreshUi,
  captureOmnichannelRefreshSnapshot,
  omnichannelRefreshObserved,
  readOmnichannelRefreshResult,
} from "./omnichannel";

const linkedOmnichannel = {
  source: "D365",
  status: "LINKED",
  identity: { customerGroup: "RETAIL", currency: "AED" },
  balance: {
    activePoints: "95.24",
    usedPoints: "0",
    issuedPoints: "95.24",
    expiredPoints: "0",
    unvestedPoints: "0",
  },
  sync: {
    fetchedAt: "2026-10-15T08:00:00.000Z",
    lastSuccessfulSyncAt: "2026-10-15T08:00:00.000Z",
    isFresh: true,
    source: "CACHE",
  },
  websiteRedemption: { enabled: false, reason: "D365_REDEMPTION_NOT_AVAILABLE" },
};

describe("omnichannel reader", () => {
  it("keeps D365 activePoints as a decimal string off the platform wallet", () => {
    const wallet = readLoyaltyWallet({
      enabled: true,
      member: true,
      market: { code: "UAE", currencyCode: "AED" },
      wallet: { availablePoints: 500, pendingPoints: 0, reservedPoints: 0, debtPoints: 0 },
      omnichannel: linkedOmnichannel,
    });
    expect(wallet.availablePoints).toBe(500);
    expect(wallet.omnichannel?.balance?.activePoints).toBe("95.24");
    expect(typeof wallet.omnichannel?.balance?.activePoints).toBe("string");
    expect(wallet.availablePoints).not.toBe(95.24);
    expect(wallet.omnichannel?.websiteRedemption.enabled).toBe(false);
  });

  it("treats LINKED zero as an enrolled zero balance string", () => {
    const view = readOmnichannelLoyalty({
      ...linkedOmnichannel,
      balance: { ...linkedOmnichannel.balance, activePoints: "0" },
    });
    expect(view?.status).toBe("LINKED");
    expect(view?.balance?.activePoints).toBe("0");
  });

  it("does not invent a zero balance for NOT_ENROLLED", () => {
    const view = readOmnichannelLoyalty({
      source: "D365",
      status: "NOT_ENROLLED",
      identity: null,
      balance: null,
      sync: { fetchedAt: null, lastSuccessfulSyncAt: null, isFresh: false, source: "UNAVAILABLE" },
      websiteRedemption: { enabled: false, reason: "D365_REDEMPTION_NOT_AVAILABLE" },
    });
    expect(view?.status).toBe("NOT_ENROLLED");
    expect(view?.balance).toBeNull();
  });

  it("falls back to LINKED / NOT_ENROLLED only when refresh is omitted", () => {
    expect(omnichannelRefreshUi(readOmnichannelLoyalty(linkedOmnichannel))).toMatchObject({
      visible: true,
      clickable: true,
      fallback: true,
    });
    expect(
      omnichannelRefreshUi(
        readOmnichannelLoyalty({
          ...linkedOmnichannel,
          status: "NOT_ENROLLED",
          identity: null,
          balance: null,
        }),
      ).clickable,
    ).toBe(true);
    expect(
      omnichannelRefreshUi(
        readOmnichannelLoyalty({
          ...linkedOmnichannel,
          status: "ACTION_REQUIRED",
          identity: null,
          balance: null,
        }),
      ).visible,
    ).toBe(false);
  });

  it("lets server refresh capability override LINKED and NOT_ENROLLED heuristics", () => {
    const disabled = {
      enabled: false,
      refreshable: false,
      reason: "DISABLED",
      retryAfterSeconds: null,
    };
    expect(
      omnichannelRefreshUi(
        readOmnichannelLoyalty({ ...linkedOmnichannel, refresh: disabled }),
      ).visible,
    ).toBe(false);
    expect(
      omnichannelRefreshUi(
        readOmnichannelLoyalty({
          ...linkedOmnichannel,
          status: "NOT_ENROLLED",
          identity: null,
          balance: null,
          refresh: disabled,
        }),
      ).visible,
    ).toBe(false);
    expect(canRequestOmnichannelRefresh(readOmnichannelLoyalty({ ...linkedOmnichannel, refresh: disabled }))).toBe(
      false,
    );
  });

  it("reads L5D READY / COOLDOWN / NOT_READY capability", () => {
    const ready = omnichannelRefreshUi(
      readOmnichannelLoyalty({
        ...linkedOmnichannel,
        refresh: { enabled: true, refreshable: true, reason: "READY", retryAfterSeconds: null },
      }),
    );
    expect(ready).toMatchObject({ visible: true, clickable: true, cooling: false, fallback: false });

    const cooldown = omnichannelRefreshUi(
      readOmnichannelLoyalty({
        ...linkedOmnichannel,
        refresh: { enabled: true, refreshable: false, reason: "COOLDOWN", retryAfterSeconds: 45 },
      }),
    );
    expect(cooldown).toMatchObject({
      visible: true,
      clickable: false,
      cooling: true,
      retryAfterSeconds: 45,
    });

    const notReady = omnichannelRefreshUi(
      readOmnichannelLoyalty({
        ...linkedOmnichannel,
        refresh: { enabled: true, refreshable: false, reason: "NOT_READY", retryAfterSeconds: null },
      }),
    );
    expect(notReady.visible).toBe(false);
  });

  it("treats a newer fetchedAt as a completed refresh even when points are unchanged", () => {
    const before = captureOmnichannelRefreshSnapshot(readOmnichannelLoyalty(linkedOmnichannel), null)!;
    const after = captureOmnichannelRefreshSnapshot(
      readOmnichannelLoyalty({
        ...linkedOmnichannel,
        sync: {
          ...linkedOmnichannel.sync,
          fetchedAt: "2026-10-15T08:00:10.000Z",
          lastSuccessfulSyncAt: "2026-10-15T08:00:10.000Z",
        },
      }),
      null,
    )!;
    expect(before.activePoints).toBe("95.24");
    expect(after.activePoints).toBe("95.24");
    expect(omnichannelRefreshObserved(before, after)).toBe(true);
  });

  it("reads QUEUED refresh results without identity fields", () => {
    expect(
      readOmnichannelRefreshResult({
        status: "QUEUED",
        refreshRequestedAt: "2026-10-15T08:01:00.000Z",
        retryAfterSeconds: null,
      }),
    ).toEqual({
      status: "QUEUED",
      refreshRequestedAt: "2026-10-15T08:01:00.000Z",
      retryAfterSeconds: null,
    });
  });

  it("formats decimal point strings without Number coercion", () => {
    expect(formatPointQuantity("95.24")).toBe("95.24");
    expect(formatPointQuantity("20.5")).toBe("20.5");
    expect(formatPointQuantity("0")).toBe("0");
    expect(formatPointQuantity("95.24")).not.toBe("95");
  });
});

describe("external activity reader", () => {
  it("keeps platform and D365 rows on separate lists", () => {
    const page = readLoyaltyActivityPage({
      items: [{ id: "p1", type: "POINTS_ADJUSTMENT", points: 40, occurredAt: "2026-10-01T00:00:00.000Z" }],
      pageInfo: { total: 1, limit: 20, offset: 0, hasMore: false },
      platformActivity: [
        { id: "p1", type: "POINTS_ADJUSTMENT", points: 40, occurredAt: "2026-10-01T00:00:00.000Z" },
      ],
      externalActivity: [
        {
          source: "D365",
          entryType: "Earn",
          category: "EARN",
          points: "95.24",
          remainingPoints: "95.24",
          entryDate: "2026-10-01T00:00:00.000Z",
          expirationDate: null,
          salesOrderId: null,
          receiptId: "R1",
          origin: "STORE",
          operatorId: "should-not-be-copied",
          channel: { terminal: "T1", operatingUnit: "OU" },
        },
      ],
      externalPageInfo: { total: 1, limit: 20, offset: 0, hasMore: false },
      lastTransactionImportSuccessAt: "2026-10-15T08:00:00.000Z",
      activityIsFresh: false,
    });
    expect(page.platformActivity).toHaveLength(1);
    expect(page.platformActivity[0]?.label).toBe("Points adjustment");
    expect(page.externalActivity).toHaveLength(1);
    expect(page.externalActivity[0]?.points).toBe("95.24");
    expect(page.externalActivity[0]?.origin).toBe("STORE");
    expect(page.activityIsFresh).toBe(false);
    expect(JSON.stringify(page.externalActivity[0])).not.toContain("operatorId");
    expect(JSON.stringify(page.externalActivity[0])).not.toContain("T1");
  });

  it("labels OTHER without calling it Earn", () => {
    const rows = readExternalLoyaltyActivity([
      {
        source: "D365",
        entryType: "ReturnEarned",
        category: "OTHER",
        points: "20.5",
        remainingPoints: "20.5",
        entryDate: "2026-10-02T00:00:00.000Z",
        origin: "UNKNOWN",
      },
    ]);
    expect(externalActivityLabel(rows[0]!)).toBe("Store reward activity");
    expect(externalActivityLabel(rows[0]!)).not.toMatch(/earn/i);
    expect(rows[0]?.points).toBe("20.5");
  });
});
