import type { Metadata } from "next";
import { Nunito } from "next/font/google";
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
const themeInitScript = `(function(){try{var t=localStorage.getItem('sa-color-mode');if(!t)t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';if(t==='dark')document.documentElement.classList.add('dark');else document.documentElement.classList.remove('dark');}catch(e){}})();`;

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
      </head>
      <body className="flex min-h-full flex-col bg-page font-sans text-sa-primary">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
