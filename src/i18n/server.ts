import "server-only";

import { cookies, headers } from "next/headers";

import { LOCALE_COOKIE, getDictionary, isLocale, negotiate, type Dictionary, type Locale } from "./config";

/** The visitor's language: their saved choice, otherwise their browser's language. */
export async function getLocale(): Promise<Locale> {
  const saved = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isLocale(saved)) return saved;
  return negotiate((await headers()).get("accept-language"));
}

export async function getI18n(): Promise<{ locale: Locale; t: Dictionary }> {
  const locale = await getLocale();
  return { locale, t: getDictionary(locale) };
}
