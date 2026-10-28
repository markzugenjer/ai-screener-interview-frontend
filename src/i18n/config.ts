import en, { type Dictionary } from "./dictionaries/en";
import id from "./dictionaries/id";

export const locales = ["en", "id"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";
export const LOCALE_COOKIE = "ais_locale";

export const localeNames: Record<Locale, string> = { en: "English", id: "Bahasa Indonesia" };
export const localeShort: Record<Locale, string> = { en: "EN", id: "ID" };

const dictionaries: Record<Locale, Dictionary> = { en, id };

export function isLocale(v: string | undefined | null): v is Locale {
  return !!v && (locales as readonly string[]).includes(v);
}

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

/** Picks the best supported language from an Accept-Language header. */
export function negotiate(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) return defaultLocale;
  const ranked = acceptLanguage
    .split(",")
    .map((part) => {
      const [tag, q] = part.trim().split(";q=");
      return { tag: (tag ?? "").toLowerCase(), q: q ? Number(q) : 1 };
    })
    .sort((a, b) => b.q - a.q);
  for (const { tag } of ranked) {
    const base = tag.split("-")[0];
    if (base === "id" || base === "ms") return "id"; // Malay speakers read Indonesian comfortably
    if (base === "en") return "en";
  }
  return defaultLocale;
}

export type { Dictionary };
