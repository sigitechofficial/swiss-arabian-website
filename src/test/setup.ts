import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";

// jsdom does not implement layout APIs that every browser has. Stub them so
// components that scroll elements into view can render in tests.
if (typeof Element !== "undefined" && !Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = function scrollIntoView() {};
}

/**
 * Unit tests never reach a real server. Without this, an unmocked request
 * goes to whatever API is configured locally (e.g. the dev backend on
 * :3002): its 401 ends the test session mid-test, and results depend on what
 * happens to be running on the machine. Tests that need HTTP mock it
 * (vi.mock of the service, or vi.stubGlobal("fetch", ...)).
 */
const blockedFetch: typeof fetch = (input) => {
  const url =
    typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
  return Promise.reject(
    new TypeError(`Unmocked network request in a unit test: ${url}`),
  );
};
globalThis.fetch = blockedFetch;

// Restore the guard after tests that stub fetch with vi.stubGlobal.
afterEach(() => {
  if (globalThis.fetch !== blockedFetch && !("mock" in globalThis.fetch)) {
    globalThis.fetch = blockedFetch;
  }
});

// Browser storage survives between tests in the same file under jsdom;
// clear it so one test's saved state cannot change the next test.
afterEach(() => {
  if (typeof window !== "undefined") {
    window.localStorage.clear();
    window.sessionStorage.clear();
  }
});
