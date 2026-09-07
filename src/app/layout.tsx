import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import { InsiderScripts } from "@/components/layout/InsiderScripts";
import { env } from "@/lib/config/env";
import { AppProviders } from "./providers";
import "./globals.css";

/** Figma: Nunito Medium / SemiBold / Bold across header + UI */
const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Swiss Arabian",
    template: "%s · Swiss Arabian",
  },
  description:
    "Swiss Arabian fragrances — oud, musk, and contemporary scents for every journey.",
};

/** Avoid flash: apply saved theme before paint (matches ThemeProvider key). */
const themeInitScript = `(function(){try{var t=localStorage.getItem('sa-color-mode');if(t!=='dark'&&t!=='light')t='light';if(t==='dark')document.documentElement.classList.add('dark');else document.documentElement.classList.remove('dark');}catch(e){}})();`;

/**
 * Web SDK: page type + init must exist in InsiderQueue *before* ins.js.
 * Confirmation uses type:purchase (onboarding inspector). May duplicate backend PAID collect.
 * PDP/cart skip here (need product/cart payload from the client).
 */
const insiderQueueBootScript = `(function(){try{window.InsiderQueue=window.InsiderQueue||[];var p=location.pathname||"/";var s=p.split("/").filter(Boolean);if(p.indexOf("/order-confirmation")===0||p.indexOf("/checkout/payment/success")===0){window.InsiderQueue.push({type:"purchase"});window.InsiderQueue.push({type:"init"});window.__SA_INSIDER_HEAD_PATH__=p;return;}var pdp=s.length===2&&s[0]==="products";var cart=s.length===1&&s[0]==="cart";if(pdp||cart)return;var t="other";if(p==="/"||p==="")t="home";else if(s[0]==="products"||s[0]==="search"||s[0]==="collections")t="category";window.InsiderQueue.push({type:t});window.InsiderQueue.push({type:"init"});window.__SA_INSIDER_HEAD_PATH__=p;}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${nunito.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        {env.insider.enabled && env.insider.accountId ? (
          <>
            <script
              dangerouslySetInnerHTML={{
                __html: insiderQueueBootScript,
              }}
            />
            <script
              async
              src={`https://${env.insider.scriptHost}/ins.js?id=${encodeURIComponent(env.insider.accountId)}`}
            />
          </>
        ) : null}
      </head>
      <body className="flex min-h-dvh flex-col bg-page font-sans text-sa-primary" suppressHydrationWarning>
        <InsiderScripts />
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
