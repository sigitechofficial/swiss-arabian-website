import type { Metadata } from "next";
import { env } from "@/lib/config/env";
import { AppProviders } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Swiss Arabian",
    template: "%s · Swiss Arabian",
  },
  description:
    "Swiss Arabian fragrances — oud, musk, and contemporary scents for every journey.",
  robots:
    env.appEnv === "production"
      ? { index: true, follow: true }
      : { index: false, follow: false },
};

const themeInitScript = `(function(){try{var t=localStorage.getItem('sa-color-mode');if(t!=='dark'&&t!=='light')t='light';if(t==='dark')document.documentElement.classList.add('dark');else document.documentElement.classList.remove('dark');}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="flex min-h-dvh flex-col">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
