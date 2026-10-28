import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";

import { AppProviders } from "@/i18n/client";
import { getI18n } from "@/i18n/server";
import "./globals.css";

// Plus Jakarta Sans, designed in Jakarta. Self-hosted: no third-party font requests.
const jakarta = localFont({
  src: [
    { path: "../../node_modules/@fontsource-variable/plus-jakarta-sans/files/plus-jakarta-sans-latin-wght-normal.woff2", style: "normal" },
    { path: "../../node_modules/@fontsource-variable/plus-jakarta-sans/files/plus-jakarta-sans-latin-ext-wght-normal.woff2", style: "normal" },
  ],
  weight: "200 800",
  variable: "--font-jakarta",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return {
    title: { default: t.meta.title, template: "%s · Dicy Talks" },
    description: t.meta.description,
    robots: { index: true, follow: true },
  };
}

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { locale } = await getI18n();
  return (
    // suppressHydrationWarning: browser extensions (e.g. ColorZilla, Grammarly) add
    // attributes to <html>/<body> before React loads. This only ignores attribute
    // differences on these two tags; mismatches inside the page are still reported.
    <html lang={locale} className={jakarta.variable} suppressHydrationWarning>
      <body className="min-h-dvh font-sans" suppressHydrationWarning>
        <AppProviders locale={locale}>{children}</AppProviders>
      </body>
    </html>
  );
}
