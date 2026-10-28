import type { Locale } from "./config";

/** Fills {placeholders}: fmt("Hi {name}", { name: "Budi" }) -> "Hi Budi". */
export function fmt(template: string, vars: Record<string, string | number> = {}): string {
  return template.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
}

const intlLocale: Record<Locale, string> = { en: "en-GB", id: "id-ID" };

const dateCache = new Map<string, Intl.DateTimeFormat>();
function dtf(locale: Locale, withTime: boolean): Intl.DateTimeFormat {
  const key = `${locale}-${withTime}`;
  let f = dateCache.get(key);
  if (!f) {
    f = new Intl.DateTimeFormat(intlLocale[locale], {
      day: "numeric",
      month: "short",
      year: "numeric",
      ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
      timeZone: "Asia/Jakarta",
    });
    dateCache.set(key, f);
  }
  return f;
}

export const formatDate = (iso: string, locale: Locale) => dtf(locale, false).format(new Date(iso));
export const formatDateTime = (iso: string, locale: Locale) => `${dtf(locale, true).format(new Date(iso))} WIB`;
