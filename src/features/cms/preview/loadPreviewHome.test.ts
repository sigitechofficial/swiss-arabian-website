import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ cookie: undefined as string | undefined }));
const api = vi.hoisted(() => ({ fetchPreviewHome: vi.fn() }));

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => (state.cookie ? { value: state.cookie } : undefined) }),
  headers: async () => new Headers({ host: "sapil.test:3060" }),
}));
vi.mock("../api/cmsContent.service", () => api);
vi.mock("./previewCookie", () => ({
  CMS_PREVIEW_COOKIE: "cms-preview",
  decodePreviewSession: (raw?: string) =>
    raw ? { zoneCode: "SAPIL_UAE", languageCode: "en-ae", token: "tok" } : null,
}));

import { loadCmsPreviewHome } from "./loadPreviewHome";

beforeEach(() => {
  state.cookie = undefined;
  api.fetchPreviewHome.mockReset();
});

describe("loadCmsPreviewHome", () => {
  it("expired without a preview session (no API call)", async () => {
    expect(await loadCmsPreviewHome()).toEqual({ status: "expired" });
    expect(api.fetchPreviewHome).not.toHaveBeenCalled();
  });

  it("ready with sections, asked with the session's market, language and token", async () => {
    state.cookie = "x";
    const result = { page: { id: "p" }, sections: [{ id: "s" }] };
    api.fetchPreviewHome.mockResolvedValue(result);
    expect(await loadCmsPreviewHome()).toEqual({ status: "ready", zoneCode: "SAPIL_UAE", languageCode: "en-ae", result });
    expect(api.fetchPreviewHome).toHaveBeenCalledWith(
      expect.objectContaining({ zoneCode: "SAPIL_UAE", languageCode: "en-ae", previewToken: "tok" }),
    );
  });

  it("empty when the Draft has no sections", async () => {
    state.cookie = "x";
    api.fetchPreviewHome.mockResolvedValue({ page: null, sections: [] });
    expect((await loadCmsPreviewHome()).status).toBe("empty");
  });
});
