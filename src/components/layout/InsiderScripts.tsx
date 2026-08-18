import Script from "next/script";
import { env } from "@/lib/config/env";

/**
 * Queues Insider calls until ins.js loads, then replays them.
 * Must sit in <head> before any other Insider usage.
 */
const INSIDER_BOOTSTRAP = `
window.insider_object = "Insider";
window["Insider"] = window["Insider"] || {
  eventBuffer: { name: "Insider", buffer: [] },
  track: {
    setUser: function() { window.Insider.eventBuffer.buffer.push(["setUser", arguments]); },
    setItem: function() { window.Insider.eventBuffer.buffer.push(["setItem", arguments]); },
    addItem: function() { window.Insider.eventBuffer.buffer.push(["addItem", arguments]); },
    removeItem: function() { window.Insider.eventBuffer.buffer.push(["removeItem", arguments]); },
    purchase: function() { window.Insider.eventBuffer.buffer.push(["purchase", arguments]); },
    logout: function() { window.Insider.eventBuffer.buffer.push(["logout", arguments]); }
  },
  identify: function() { window.Insider.eventBuffer.buffer.push(["identify", arguments]); }
};
`;

/** Insider Web SDK — rendered from root layout <head>. No-op without account ID. */
export function InsiderScripts() {
  if (!env.insider.enabled || !env.insider.accountId) return null;

  const src = `https://${env.insider.scriptHost}/ins.js?id=${encodeURIComponent(env.insider.accountId)}`;

  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: INSIDER_BOOTSTRAP }} />
      <Script src={src} strategy="afterInteractive" />
    </>
  );
}
