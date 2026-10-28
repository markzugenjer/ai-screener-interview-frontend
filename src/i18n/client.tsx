"use client";

import { MotionConfig } from "motion/react";
import { createContext, useContext } from "react";

import { getDictionary, type Dictionary, type Locale } from "./config";

const I18nContext = createContext<{ locale: Locale; t: Dictionary } | null>(null);

/**
 * Makes the current language available to client components, and applies the
 * visitor's reduced-motion preference to every animation in the app.
 * Only the locale crosses the server/client boundary; the dictionary is bundled.
 */
export function AppProviders({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return (
    <I18nContext.Provider value={{ locale, t: getDictionary(locale) }}>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside <AppProviders>");
  return ctx;
}
