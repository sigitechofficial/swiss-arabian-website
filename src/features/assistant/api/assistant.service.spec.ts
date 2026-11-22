import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchAssistantEnabled } from "./assistant.service";

const apiGet = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api/apiClient", () => ({
  apiGet: (...args: unknown[]) => apiGet(...args),
  apiPost: vi.fn(),
  apiDelete: vi.fn(),
}));

/** The assistant is on or off per brand + market in the admin: the website asks per market. */
describe("fetchAssistantEnabled", () => {
  beforeEach(() => {
    apiGet.mockReset();
  });

  it("asks the backend for this market", async () => {
    apiGet.mockResolvedValue({ enabled: true });
    await expect(fetchAssistantEnabled("URD1")).resolves.toBe(true);
    expect(apiGet).toHaveBeenCalledWith("/storefront/assistant/status?zoneCode=URD1");
  });

  it("anything but an explicit on, or a failure, means off", async () => {
    apiGet.mockResolvedValue({});
    await expect(fetchAssistantEnabled("QTR")).resolves.toBe(false);
    apiGet.mockImplementation(() => Promise.reject(new Error("down")));
    await expect(fetchAssistantEnabled("QTR")).resolves.toBe(false);
  });
});
