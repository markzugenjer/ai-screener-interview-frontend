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
    title: { default: t.meta.title, template: "%s · Nara" },
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
    <html lang={locale} className={jakarta.variable}>
      <body className="min-h-dvh font-sans">
        <AppProviders locale={locale}>{children}</AppProviders>
      </body>
    </html>
  );
}
